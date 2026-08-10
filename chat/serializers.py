from rest_framework import serializers
from .models import ChatRoom, Message
from accounts.serializers import UserSerializer


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_avatar = serializers.SerializerMethodField()
    attachment_url = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()
    time_str = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id', 'room', 'sender', 'sender_name', 'sender_avatar',
            'content', 'message_type', 'attachment', 'attachment_url',
            'is_note', 'is_read', 'created_at', 'time_str', 'is_mine'
        ]
        read_only_fields = ['id', 'room', 'sender', 'created_at']

    def get_sender_name(self, obj):
        return f"{obj.sender.first_name} {obj.sender.last_name}".strip() or obj.sender.username

    def get_sender_avatar(self, obj):
        if obj.sender.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.sender.profile_picture.url)
            return obj.sender.profile_picture.url
        return None

    def get_attachment_url(self, obj):
        if obj.attachment:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.attachment.url)
            return obj.attachment.url
        return None

    def get_is_mine(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.sender_id == request.user.id
        return False

    def get_time_str(self, obj):
        from django.utils import timezone
        try:
            return timezone.localtime(obj.created_at).strftime('%I:%M %p')
        except Exception:
            return obj.created_at.strftime('%I:%M %p')



class ChatRoomSerializer(serializers.ModelSerializer):
    mentor_details = UserSerializer(source='mentor', read_only=True)
    mentee_details = UserSerializer(source='mentee', read_only=True)
    other_user = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = [
            'id', 'mentor', 'mentor_details', 'mentee', 'mentee_details',
            'other_user', 'last_message', 'unread_count', 'created_at', 'last_message_at'
        ]

    def get_other_user(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            other = obj.get_other_user(request.user)
            return UserSerializer(other, context=self.context).data
        return None

    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            return MessageSerializer(last_msg, context=self.context).data
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0
