from rest_framework import serializers
from .models_notifications import Notification, NotificationSetting

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'type', 'is_read', 'created_at']

class NotificationSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationSetting
        fields = [
            'email_enabled',
            'push_enabled',
            'low_stock',
            'order',
            'payment',
        ]