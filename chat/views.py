import io
import json
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib import messages
from accounts.models import User
from .models import ChatRoom, Message


@login_required
def chat_list(request):
    user = request.user
    if user.role == 'mentor':
        rooms = ChatRoom.objects.filter(mentor=user).order_by('-last_message_at')
    else:
        rooms = ChatRoom.objects.filter(mentee=user).order_by('-last_message_at')
    return render(request, 'chat/chat_list.html', {'rooms': rooms})


@login_required
def chat_room(request, room_id=None, user_id=None):
    user = request.user
    if user_id:
        other_user = get_object_or_404(User, pk=user_id)
        if user.role == 'mentor':
            room, created = ChatRoom.objects.get_or_create(mentor=user, mentee=other_user)
        else:
            room, created = ChatRoom.objects.get_or_create(mentor=other_user, mentee=user)
    else:
        room = get_object_or_404(ChatRoom, pk=room_id)
        if user not in [room.mentor, room.mentee]:
            messages.error(request, 'Access denied.')
            return redirect('chat:chat_list')
    chat_messages = room.messages.order_by('created_at')
    # Mark messages as read
    chat_messages.exclude(sender=user).update(is_read=True)
    other = room.get_other_user(user)
    return render(request, 'chat/chat_room.html', {
        'room': room,
        'messages': chat_messages,
        'other_user': other,
    })


@login_required
def send_message(request, room_id):
    if request.method == 'POST':
        room = get_object_or_404(ChatRoom, pk=room_id)
        if request.user not in [room.mentor, room.mentee]:
            return JsonResponse({'error': 'Access denied'}, status=403)
        content = request.POST.get('content', '').strip()
        is_note = request.POST.get('is_note') == 'true'
        attachment = request.FILES.get('attachment')
        if content or attachment:
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
            return JsonResponse({
                'success': True,
                'message': {
                    'id': msg.id,
                    'content': msg.content,
                    'sender': msg.sender.username,
                    'sender_name': f"{msg.sender.first_name} {msg.sender.last_name}",
                    'is_note': msg.is_note,
                    'type': msg.message_type,
                    'created_at': msg.created_at.strftime('%I:%M %p'),
                    'attachment_url': msg.attachment.url if msg.attachment else None,
                }
            })
    return JsonResponse({'error': 'Invalid request'}, status=400)


@login_required
def get_messages(request, room_id):
    room = get_object_or_404(ChatRoom, pk=room_id)
    if request.user not in [room.mentor, room.mentee]:
        return JsonResponse({'error': 'Access denied'}, status=403)
    last_id = request.GET.get('last_id', 0)
    msgs = room.messages.filter(id__gt=last_id).order_by('created_at')
    msgs.exclude(sender=request.user).update(is_read=True)
    data = [{
        'id': m.id,
        'content': m.content,
        'sender': m.sender.username,
        'sender_name': f"{m.sender.first_name} {m.sender.last_name}",
        'is_mine': m.sender == request.user,
        'is_note': m.is_note,
        'type': m.message_type,
        'created_at': m.created_at.strftime('%I:%M %p'),
        'attachment_url': m.attachment.url if m.attachment else None,
    } for m in msgs]
    return JsonResponse({'messages': data})


@login_required
def export_chat_pdf(request, room_id):
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.units import inch

    room = get_object_or_404(ChatRoom, pk=room_id)
    if request.user not in [room.mentor, room.mentee]:
        messages.error(request, 'Access denied.')
        return redirect('chat:chat_list')

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=inch, bottomMargin=inch)
    styles = getSampleStyleSheet()
    story = []

    title = Paragraph(f"Chat Export - {room.mentor.get_full_name()} & {room.mentee.get_full_name()}", styles['Title'])
    story.append(title)
    story.append(Spacer(1, 0.3 * inch))

    chat_messages = room.messages.order_by('created_at')
    for msg in chat_messages:
        sender_name = f"{msg.sender.first_name} {msg.sender.last_name}"
        time_str = msg.created_at.strftime('%Y-%m-%d %I:%M %p')
        note_tag = " [NOTE]" if msg.is_note else ""
        header = Paragraph(f"<b>{sender_name}</b> — {time_str}{note_tag}", styles['Normal'])
        story.append(header)
        body = Paragraph(msg.content, styles['BodyText'])
        story.append(body)
        story.append(Spacer(1, 0.15 * inch))

    doc.build(story)
    buffer.seek(0)
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="chat_{room_id}.pdf"'
    return response
