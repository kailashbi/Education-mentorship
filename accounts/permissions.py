from rest_framework import permissions


class IsAdminRole(permissions.BasePermission):
    """Allows access only to superusers or users with role='admin'."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.is_superuser or request.user.role == 'admin'))


class IsMentorRole(permissions.BasePermission):
    """Allows access to users with role='mentor'."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'mentor')


class IsApprovedMentor(permissions.BasePermission):
    """Allows access only to mentors whose profile has been approved by admin."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and request.user.role == 'mentor'):
            return False
        try:
            return request.user.mentor_profile.approval_status == 'approved' and not request.user.is_suspended
        except Exception:
            return False


class IsMenteeRole(permissions.BasePermission):
    """Allows access to users with role='mentee'."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'mentee' and not request.user.is_suspended)
