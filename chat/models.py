from django.db import models
from accounts.models import User


class ChatRoom(models.Model):
    mentor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mentor_chats')
    mentee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mentee_chats')
    created_at = models.DateTimeField(auto_now_add=True)
    last_message_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('mentor', 'mentee')

    def __str__(self):
        return f"Chat: {self.mentor.username} & {self.mentee.username}"

    def get_other_user(self, user):
        if user == self.mentor:
            return self.mentee
        return self.mentor


class Message(models.Model):
    MESSAGE_TYPES = [
        ('text', 'Text'),
        ('note', 'Note'),
        ('file', 'File'),
    ]
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='text')
    attachment = models.FileField(upload_to='chat_files/', blank=True, null=True)
    is_note = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}"
