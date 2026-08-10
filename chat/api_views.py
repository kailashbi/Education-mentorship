import io
from rest_framework import status, views, permissions
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from django.http import HttpResponse

from accounts.models import User
from .models import ChatRoom, Message
from .serializers import ChatRoomSerializer, MessageSerializer


class ChatRoomListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Auto-sync chat rooms for all booked sessions and subscriptions
        try:
            from sessions_app.models import SessionRequest, MentorshipSubscription, LiveSession
            if user.role == 'mentor':
                mentee_ids = set(SessionRequest.objects.filter(mentor=user).values_list('mentee_id', flat=True))
                mentee_ids.update(MentorshipSubscription.objects.filter(mentor=user).values_list('mentee_id', flat=True))
                mentee_ids.update(LiveSession.objects.filter(mentor=user).values_list('mentee_id', flat=True))
                for m_id in mentee_ids:
                    if m_id and m_id != user.id:
                        ChatRoom.objects.get_or_create(mentor=user, mentee_id=m_id)
                rooms = ChatRoom.objects.filter(mentor=user).order_by('-last_message_at', '-id')
            else:
                mentor_ids = set(SessionRequest.objects.filter(mentee=user).values_list('mentor_id', flat=True))
                mentor_ids.update(MentorshipSubscription.objects.filter(mentee=user).values_list('mentor_id', flat=True))
                mentor_ids.update(LiveSession.objects.filter(mentee=user).values_list('mentor_id', flat=True))
                for m_id in mentor_ids:
                    if m_id and m_id != user.id:
                        ChatRoom.objects.get_or_create(mentor_id=m_id, mentee=user)
                rooms = ChatRoom.objects.filter(mentee=user).order_by('-last_message_at', '-id')
        except Exception:
            if user.role == 'mentor':
                rooms = ChatRoom.objects.filter(mentor=user).order_by('-last_message_at', '-id')
            else:
                rooms = ChatRoom.objects.filter(mentee=user).order_by('-last_message_at', '-id')

        serializer = ChatRoomSerializer(rooms, many=True, context={'request': request})
        return Response({'rooms': serializer.data})



class GetOrCreateChatRoomView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        current_user = request.user
        other_user = get_object_or_404(User, pk=user_id)

        if current_user.id == other_user.id:
            return Response({'error': 'Cannot chat with yourself.'}, status=status.HTTP_400_BAD_REQUEST)

        if current_user.is_suspended:
            return Response({'error': 'Your account is suspended by Administrator. Starting new chat conversations is restricted.'}, status=status.HTTP_403_FORBIDDEN)

        if current_user.role == 'mentor':
            mentor_user = current_user
            mentee_user = other_user
        else:
            mentor_user = other_user
            mentee_user = current_user

        room, created = ChatRoom.objects.get_or_create(mentor=mentor_user, mentee=mentee_user)
        serializer = ChatRoomSerializer(room, context={'request': request})
        return Response({'room': serializer.data, 'created': created})


class ChatRoomDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_id):
        room = get_object_or_404(ChatRoom, pk=room_id)
        if request.user not in [room.mentor, room.mentee] and not request.user.is_superuser:
            return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        # Mark unread messages as read
        room.messages.exclude(sender=request.user).filter(is_read=False).update(is_read=True)

        messages_qs = room.messages.order_by('created_at')
        room_data = ChatRoomSerializer(room, context={'request': request}).data
        messages_data = MessageSerializer(messages_qs, many=True, context={'request': request}).data

        return Response({
            'room': room_data,
            'messages': messages_data,
            'is_suspended': request.user.is_suspended
        })


class SendMessageView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, room_id):
        room = get_object_or_404(ChatRoom, pk=room_id)
        if request.user not in [room.mentor, room.mentee] and not request.user.is_superuser:
            return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        if request.user.is_suspended:
            return Response({'error': 'Your account is suspended by Administrator. Chat messaging has been disabled.'}, status=status.HTTP_403_FORBIDDEN)

        content = request.data.get('content', '').strip()

        is_note = str(request.data.get('is_note', '')).lower() in ['true', '1']
        attachment = request.FILES.get('attachment')

        if not content and not attachment:
            return Response({'error': 'Message content or attachment is required.'}, status=status.HTTP_400_BAD_REQUEST)

        msg_type = 'file' if attachment else ('note' if is_note else 'text')

        msg = Message.objects.create(
            room=room,
            sender=request.user,
            content=content,
            message_type=msg_type,
            attachment=attachment,
            is_note=is_note,
        )
        room.save()  # update last_message_at

        return Response({
            'message': MessageSerializer(msg, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)


class PollMessagesView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_id):
        room = get_object_or_404(ChatRoom, pk=room_id)
        if request.user not in [room.mentor, room.mentee] and not request.user.is_superuser:
            return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        last_id = int(request.GET.get('last_id', 0))
        msgs = room.messages.filter(id__gt=last_id).order_by('created_at')
        msgs.exclude(sender=request.user).update(is_read=True)

        return Response({
            'messages': MessageSerializer(msgs, many=True, context={'request': request}).data
        })


class ExportChatPDFView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_id):
        room = get_object_or_404(ChatRoom, pk=room_id)
        if request.user not in [room.mentor, room.mentee] and not request.user.is_superuser:
            return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            from reportlab.pdfgen import canvas
            from reportlab.lib.pagesizes import A4
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
            from reportlab.lib.units import inch
            from reportlab.lib import colors

            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5 * inch, bottomMargin=0.5 * inch)
            styles = getSampleStyleSheet()
            
            note_style = ParagraphStyle(
                'NoteStyle',
                parent=styles['BodyText'],
                backColor=colors.HexColor('#FEF08A'),
                borderColor=colors.HexColor('#EAB308'),
                borderWidth=1,
                borderPadding=6,
                spaceAfter=6,
                textColor=colors.HexColor('#713F12')
            )

            story = []
            title = Paragraph(f"<b>MentorHub Chat Transcript</b><br/><font size=11>Mentor: {room.mentor.get_full_name() or room.mentor.username} | Mentee: {room.mentee.get_full_name() or room.mentee.username}</font>", styles['Title'])
            story.append(title)
            story.append(Spacer(1, 0.25 * inch))

            chat_messages = room.messages.order_by('created_at')
            for msg in chat_messages:
                sender_name = msg.sender.get_full_name() or msg.sender.username
                time_str = msg.created_at.strftime('%Y-%m-%d %I:%M %p')
                
                header_text = f"<b>{sender_name}</b> <font color='#64748B' size=8>({time_str})</font>"
                story.append(Paragraph(header_text, styles['Normal']))

                if msg.is_note:
                    story.append(Paragraph(f"📌 <b>NOTE:</b> {msg.content}", note_style))
                else:
                    story.append(Paragraph(msg.content or "(Attachment)", styles['BodyText']))
                
                story.append(Spacer(1, 0.1 * inch))

            doc.build(story)
            buffer.seek(0)
            response = HttpResponse(buffer, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="mentorhub_chat_{room_id}.pdf"'
            return response

        except Exception as e:
            return Response({'error': f'Failed to generate PDF: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
