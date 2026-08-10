from django.core.management.base import BaseCommand
from django.utils import timezone
from accounts.models import User, MentorProfile, MenteeProfile, UserReport
from sessions_app.models import SessionRequest, LiveSession, Review
from chat.models import ChatRoom, Message


class Command(BaseCommand):
    help = 'Populates database with Indian demo users (Kailash, Ankit Mishra, Yanshu Patel, Amit, Pankaj, Dholi) and sample data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding MentorHub demo data...')

        # Clean up any legacy test channel names to prevent unique collisions
        LiveSession.objects.filter(channel_name='mentorhub_demo_session_101').delete()

        # 1. Admin User: Kailash

        admin, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'kailash.admin@mentorhub.com',
                'first_name': 'Kailash',
                'last_name': 'Admin',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
                'is_verified': True,
            }
        )
        admin.first_name = 'Kailash'
        admin.last_name = 'Admin'
        admin.set_password('admin123')
        admin.role = 'admin'
        admin.is_staff = True
        admin.is_superuser = True
        admin.is_verified = True
        admin.save()

        # 2. Approved Mentor 1: Ankit Mishra
        ankit, _ = User.objects.get_or_create(
            username='mentor_ankit',
            defaults={
                'email': 'ankit.mishra@cloudscale.in',
                'first_name': 'Ankit',
                'last_name': 'Mishra',
                'role': 'mentor',
                'is_verified': True,
                'bio': 'Principal Distributed Systems & Cloud Architect with 10+ years scaling high-throughput microservices across fintech and tech unicorns.'
            }
        )
        ankit.first_name = 'Ankit'
        ankit.last_name = 'Mishra'
        ankit.set_password('ankit123')
        ankit.role = 'mentor'
        ankit.is_verified = True
        ankit.save()

        ankit_profile, _ = MentorProfile.objects.get_or_create(
            user=ankit,
            defaults={
                'skills': 'System Design, Microservices, Python, Go, Cloud Architecture, Kubernetes, Mock Interviews',
                'experience_years': 10,
                'hourly_rate': 799.00,
                'monthly_rate': 1999.00,
                'quarterly_rate': 4999.00,
                'availability': 'Mon, Wed, Fri 2pm-7pm IST',
                'linkedin_url': 'https://www.linkedin.com/in/ankit-mishra-189b38277/',
                'github_url': 'https://github.com/AnkitMishra28',
                'demo_video_url': 'https://www.youtube.com/watch?v=A95rliroC8Q',
                'approval_status': 'approved',
                'average_rating': 4.9,
                'total_reviews': 14,
                'total_sessions': 22,
            }
        )
        ankit_profile.demo_video_url = 'https://www.youtube.com/watch?v=A95rliroC8Q'
        ankit_profile.hourly_rate = 799.00
        ankit_profile.monthly_rate = 1999.00
        ankit_profile.quarterly_rate = 4999.00
        ankit_profile.approval_status = 'approved'
        ankit_profile.save()

        # Clean up any legacy mock accounts
        User.objects.filter(username__in=['mentor_alex', 'mentor_elena', 'alex_rivera', 'elena_rostova']).delete()

        # 3. Approved Mentor 2: Yanshu Patel

        yanshu, _ = User.objects.get_or_create(
            username='mentor_yanshu',
            defaults={
                'email': 'yanshu.patel@frontendcraft.dev',
                'first_name': 'Yanshu',
                'last_name': 'Patel',
                'role': 'mentor',
                'is_verified': True,
                'bio': 'Staff Frontend Engineer specializing in React, Next.js, WebGL performance, and production Design Systems.'
            }
        )
        yanshu.first_name = 'Yanshu'
        yanshu.last_name = 'Patel'
        yanshu.set_password('yanshu123')
        yanshu.role = 'mentor'
        yanshu.is_verified = True
        yanshu.save()

        yanshu_profile, _ = MentorProfile.objects.get_or_create(
            user=yanshu,
            defaults={
                'skills': 'React, Next.js, TypeScript, UI/UX Systems, Web Performance, TailwindCSS',
                'experience_years': 7,
                'hourly_rate': 599.00,
                'monthly_rate': 1499.00,
                'quarterly_rate': 3999.00,
                'availability': 'Tue, Thu 10am-4pm IST',
                'linkedin_url': 'https://www.linkedin.com/in/yanshu-patel-165b2b297/',
                'github_url': 'https://github.com/yanshu-patel',
                'demo_video_url': 'https://www.youtube.com/watch?v=A95rliroC8Q',
                'approval_status': 'approved',
                'average_rating': 5.0,
                'total_reviews': 9,
                'total_sessions': 15,
            }
        )
        yanshu_profile.demo_video_url = 'https://www.youtube.com/watch?v=A95rliroC8Q'
        yanshu_profile.hourly_rate = 599.00
        yanshu_profile.monthly_rate = 1499.00
        yanshu_profile.quarterly_rate = 3999.00
        yanshu_profile.approval_status = 'approved'
        yanshu_profile.save()


        # 4. Approved Mentor 3: Amit Sharma
        amit, _ = User.objects.get_or_create(
            username='mentor_amit',
            defaults={
                'email': 'amit.sharma@ailabs.in',
                'first_name': 'Amit',
                'last_name': 'Sharma',
                'role': 'mentor',
                'is_verified': True,
                'bio': 'AI/ML Engineering Lead with expertise in Large Language Models, PyTorch, RAG Pipelines, and Data Engineering.'
            }
        )
        amit.first_name = 'Amit'
        amit.last_name = 'Sharma'
        amit.set_password('amit123')
        amit.role = 'mentor'
        amit.is_verified = True
        amit.save()

        amit_profile, _ = MentorProfile.objects.get_or_create(
            user=amit,
            defaults={
                'skills': 'Python, PyTorch, Generative AI, RAG Systems, Data Engineering, LLMOps, MLOps',
                'experience_years': 9,
                'hourly_rate': 899.00,
                'monthly_rate': 2299.00,
                'quarterly_rate': 5999.00,
                'availability': 'Sat, Sun 11am-5pm IST',
                'linkedin_url': 'https://www.linkedin.com/in/amit-sharma-ai/',
                'github_url': 'https://github.com/amit-sharma-ml',
                'demo_video_url': 'https://www.youtube.com/watch?v=A95rliroC8Q',
                'approval_status': 'approved',
                'average_rating': 4.8,
                'total_reviews': 11,
                'total_sessions': 19,
            }
        )
        amit_profile.demo_video_url = 'https://www.youtube.com/watch?v=A95rliroC8Q'
        amit_profile.hourly_rate = 899.00
        amit_profile.monthly_rate = 2299.00
        amit_profile.quarterly_rate = 5999.00
        amit_profile.approval_status = 'approved'
        amit_profile.save()

        # 5. PENDING Mentor Application: Pankaj Verma (With Pitch Video for Admin Approval)
        pankaj, _ = User.objects.get_or_create(
            username='mentor_pankaj',
            defaults={
                'email': 'pankaj.verma@devopshero.io',
                'first_name': 'Pankaj',
                'last_name': 'Verma',
                'role': 'mentor',
                'is_verified': False,
                'bio': 'DevOps & Site Reliability Engineer passionate about Kubernetes, CI/CD automation, and cloud infrastructure optimization.'
            }
        )
        pankaj.first_name = 'Pankaj'
        pankaj.last_name = 'sarwa'
        pankaj.set_password('pankaj123')
        pankaj.role = 'mentor'
        pankaj.is_verified = False
        pankaj.save()

        pankaj_profile, _ = MentorProfile.objects.get_or_create(
            user=pankaj,
            defaults={
                'skills': 'Kubernetes, Docker, AWS, Terraform, CI/CD, Linux, Prometheus',
                'experience_years': 5,
                'hourly_rate': 85.00,
                'availability': 'Mon-Fri 6pm-9pm IST',
                'linkedin_url': 'https://www.linkedin.com/in/pankaj-sarwa-2b5309364/',
                'github_url': 'https://github.com/pankaj-verma',
                'demo_video_url': 'https://www.youtube.com/watch?v=A95rliroC8Q',
                'approval_status': 'pending',
            }
        )
        pankaj_profile.demo_video_url = 'https://www.youtube.com/watch?v=A95rliroC8Q'
        pankaj_profile.approval_status = 'pending'
        pankaj_profile.save()


        # 6. Mentee 1: Dholi Kumari
        dholi, _ = User.objects.get_or_create(
            username='mentee_dholi',
            defaults={
                'email': 'dholi.kumari@techdev.io',
                'first_name': 'Dholi',
                'last_name': 'Kumari',
                'role': 'mentee',
                'is_verified': True,
                'bio': 'Aspiring Full Stack Engineer preparing for high-growth tech architecture interviews and system scaling.'
            }
        )
        dholi.first_name = 'Dholi'
        dholi.last_name = 'Kumari'
        dholi.set_password('dholi123')
        dholi.role = 'mentee'
        dholi.is_verified = True
        dholi.save()

        dholi_profile, _ = MenteeProfile.objects.get_or_create(
            user=dholi,
            defaults={
                'interests': 'System Design, Microservices, React, Backend Engineering',
                'learning_goals': 'Master distributed caching and prepare for Senior Software Engineer interviews.',
                'education': 'B.Tech in Information Technology'
            }
        )

        # 6b. Mentee 2: Rohit Sharma
        rohit, _ = User.objects.get_or_create(
            username='mentee_rohit',
            defaults={
                'email': 'rohit.sharma@cloudjourney.in',
                'first_name': 'Rohit',
                'last_name': 'Sharma',
                'role': 'mentee',
                'is_verified': True,
                'bio': 'Frontend Developer looking to master Next.js, WebGL performance, and design systems.'
            }
        )
        rohit.first_name = 'Rohit'
        rohit.last_name = 'Sharma'
        rohit.set_password('rohit123')
        rohit.role = 'mentee'
        rohit.is_verified = True
        rohit.save()

        MenteeProfile.objects.get_or_create(
            user=rohit,
            defaults={
                'interests': 'React, Next.js, Web Performance, UI Systems',
                'learning_goals': 'Master React Server Components and design system architecture.',
                'education': 'B.E. in Computer Science'
            }
        )

        # 6c. Mentee 3: Dinesh Meena
        dinesh, _ = User.objects.get_or_create(
            username='mentee_dinesh',
            defaults={
                'email': 'dinesh.meena@techmail.in',
                'first_name': 'Dinesh',
                'last_name': 'Meena',
                'role': 'mentee',
                'is_verified': True,
                'bio': 'Data Science enthusiast focusing on Generative AI, RAG pipelines, and PyTorch model fine-tuning.'
            }
        )
        dinesh.first_name = 'Dinesh'
        dinesh.last_name = 'Meena'
        dinesh.set_password('dinesh123')
        dinesh.role = 'mentee'
        dinesh.is_verified = True
        dinesh.save()

        MenteeProfile.objects.get_or_create(
            user=dinesh,
            defaults={
                'interests': 'Machine Learning, PyTorch, LangChain, Vector Databases, Python',
                'learning_goals': 'Build production-ready LLM pipelines and prepare for AI Lead roles.',
                'education': 'M.Tech in Data Science'
            }
        )

        # Also support alias mentee_sarah for backward compatibility
        sarah, _ = User.objects.get_or_create(
            username='mentee_sarah',
            defaults={'email': 'dholi@mentorhub.com', 'first_name': 'Dholi', 'last_name': 'Kumari', 'role': 'mentee', 'is_verified': True}
        )
        sarah.set_password('sarah123')
        sarah.save()
        MenteeProfile.objects.get_or_create(user=sarah, defaults={'interests': 'System Design, React'})

        # 7. Sample Session Requests & Live Sessions
        session1, _ = SessionRequest.objects.get_or_create(
            mentee=dholi,
            mentor=ankit,
            topic='Distributed Cache & Sharding Strategy',
            defaults={
                'description': 'Reviewing Redis cluster caching layers and consistent hashing algorithms.',
                'proposed_date': timezone.now() + timezone.timedelta(days=1),
                'duration_minutes': 60,
                'status': 'accepted',
            }
        )

        channel_id1 = f'mentorhub_session_live_{session1.id}'
        live_session1 = LiveSession.objects.filter(session_request=session1).first()
        if not live_session1:
            LiveSession.objects.filter(channel_name=channel_id1).delete()
            live_session1 = LiveSession.objects.create(
                session_request=session1,
                mentee=dholi,
                mentor=ankit,
                channel_name=channel_id1,
                is_active=False
            )

        # Rohit's session with Yanshu Patel
        session_rohit, _ = SessionRequest.objects.get_or_create(
            mentee=rohit,
            mentor=yanshu,
            topic='Next.js App Router & Server Components Migration',
            defaults={
                'description': 'Architectural review for converting client-side dashboards to RSC.',
                'proposed_date': timezone.now() + timezone.timedelta(days=2),
                'duration_minutes': 45,
                'status': 'accepted',
            }
        )

        channel_id_rohit = f'mentorhub_session_live_{session_rohit.id}'
        if not LiveSession.objects.filter(session_request=session_rohit).exists():
            LiveSession.objects.filter(channel_name=channel_id_rohit).delete()
            LiveSession.objects.create(
                session_request=session_rohit,
                mentee=rohit,
                mentor=yanshu,
                channel_name=channel_id_rohit,
                is_active=False
            )

        # Dinesh's session with Amit Sharma
        session_dinesh, _ = SessionRequest.objects.get_or_create(
            mentee=dinesh,
            mentor=amit,
            topic='RAG Pipeline & Embeddings Optimization',
            defaults={
                'description': 'Deep dive into vector database index partitioning and chunking strategies.',
                'proposed_date': timezone.now() + timezone.timedelta(days=3),
                'duration_minutes': 60,
                'status': 'accepted',
            }
        )

        # 8. Sample Reviews
        session2, _ = SessionRequest.objects.get_or_create(
            mentee=dholi,
            mentor=ankit,
            topic='System Design Interview Mock Call',
            defaults={
                'description': 'Designed a global rate limiter and URL shortener.',
                'proposed_date': timezone.now() - timezone.timedelta(days=3),
                'duration_minutes': 60,
                'status': 'completed',
            }
        )

        Review.objects.get_or_create(
            session=session2,
            defaults={
                'mentee': dholi,
                'mentor': ankit,
                'rating': 5,
                'comment': 'Ankit Mishra provided exceptional guidance on distributed architecture trade-offs!'
            }
        )

        # 9. Sample Chats & Notes
        # Chat 1: Dholi & Ankit
        room1, _ = ChatRoom.objects.get_or_create(mentor=ankit, mentee=dholi)
        Message.objects.get_or_create(
            room=room1,
            sender=dholi,
            content='Namaste Ankit sir! Looking forward to our system design session tomorrow.',
            defaults={'message_type': 'text'}
        )
        Message.objects.get_or_create(
            room=room1,
            sender=ankit,
            content='Great to have you Dholi! Please review Consistent Hashing and Redis cluster fundamentals before we start.',
            defaults={'message_type': 'note', 'is_note': True}
        )

        # Chat 2: Rohit & Yanshu
        room2, _ = ChatRoom.objects.get_or_create(mentor=yanshu, mentee=rohit)
        Message.objects.get_or_create(
            room=room2,
            sender=rohit,
            content='Hi Yanshu sir, I have set up our Next.js repository for our upcoming code review.',
            defaults={'message_type': 'text'}
        )
        Message.objects.get_or_create(
            room=room2,
            sender=yanshu,
            content='Awesome Rohit! Please ensure bundle analyzer is enabled so we can inspect payload sizes directly.',
            defaults={'message_type': 'note', 'is_note': True}
        )

        # Chat 3: Dinesh & Amit
        room3, _ = ChatRoom.objects.get_or_create(mentor=amit, mentee=dinesh)
        Message.objects.get_or_create(
            room=room3,
            sender=dinesh,
            content='Hello Amit sir, looking forward to discussing vector indexing strategies in PyTorch and LangChain!',
            defaults={'message_type': 'text'}
        )
        Message.objects.get_or_create(
            room=room3,
            sender=amit,
            content='Welcome Dinesh! Looking forward to our session on Saturday.',
            defaults={'message_type': 'text'}
        )

        # 10. Sample Suspicious User & Incident Report for Admin Chat Analysis Demo
        spammer, _ = User.objects.get_or_create(
            username='crypto_spammer',
            defaults={
                'email': 'bot@cryptopromos.xyz',
                'first_name': 'Crypto',
                'last_name': 'Scammer',
                'role': 'mentee',
                'is_verified': True,
                'bio': 'Crypto investment promoter'
            }
        )
        spammer.set_password('spammer123')
        spammer.save()

        spam_room, _ = ChatRoom.objects.get_or_create(mentor=ankit, mentee=spammer)
        Message.objects.get_or_create(
            room=spam_room,
            sender=spammer,
            content='Hey Ankit! Send 5000 INR in crypto directly to my external address for 10x guaranteed returns.',
            defaults={'message_type': 'text'}
        )
        Message.objects.get_or_create(
            room=spam_room,
            sender=ankit,
            content='This violates MentorHub platform rules. I am reporting this account to Kailash (Admin) immediately.',
            defaults={'message_type': 'text'}
        )

        report_obj, created = UserReport.objects.get_or_create(
            reporter=ankit,
            reported_user=spammer,
            defaults={
                'chat_room': spam_room,
                'category': 'scam_fraud',
                'description': 'User initiated chat asking for off-platform cryptocurrency payments and unauthorized financial promotions.',
                'status': 'pending'
            }
        )
        # 11. Seed Notifications
        from accounts.models import Notification
        Notification.objects.get_or_create(
            recipient=ankit,
            title='🎉 Welcome to MentorHub!',
            defaults={
                'message': 'Your mentor profile has been verified and listed on the marketplace.',
                'notification_type': 'approval',
                'link': '/mentor/dashboard',
                'is_read': False
            }
        )
        Notification.objects.get_or_create(
            recipient=dholi,
            title='📅 Session Confirmed with Ankit Mishra',
            defaults={
                'message': 'Your upcoming System Design Architecture session is confirmed for tomorrow at 10:00 AM IST.',
                'notification_type': 'session_accepted',
                'link': '/mentee/dashboard',
                'is_read': False
            }
        )
        Notification.objects.get_or_create(
            recipient=pankaj,
            title='⏳ Application Under Review',
            defaults={
                'message': 'Thank you for applying. An administrator is reviewing your credentials and video pitch.',
                'notification_type': 'info',
                'link': '/pending-approval',
                'is_read': False
            }
        )
        Notification.objects.get_or_create(
            recipient=spammer,
            title='⚠️ Official Admin Warning Issued',
            defaults={
                'message': 'Your account has been reported for promoting off-platform cryptocurrency transactions. Continuing will result in immediate suspension.',
                'notification_type': 'warning',
                'link': '/chat',
                'is_read': False
            }
        )

        self.stdout.write(self.style.SUCCESS('====================================================='))

        self.stdout.write(self.style.SUCCESS('[Admin] admin / admin123 (Kailash)'))
        self.stdout.write(self.style.SUCCESS('[Mentor 1] mentor_ankit / ankit123 (Ankit Mishra - Approved)'))
        self.stdout.write(self.style.SUCCESS('[Mentor 2] mentor_yanshu / yanshu123 (Yanshu Patel - Approved)'))
        self.stdout.write(self.style.SUCCESS('[Mentor 3] mentor_amit / amit123 (Amit Sharma - Approved)'))
        self.stdout.write(self.style.SUCCESS('[Mentor 4] mentor_pankaj / pankaj123 (Pankaj Verma - Pending Approval with Video)'))
        self.stdout.write(self.style.SUCCESS('[Mentee 1] mentee_dholi / dholi123 (Dholi Kumari)'))
        self.stdout.write(self.style.SUCCESS('[Mentee 2] mentee_rohit / rohit123 (Rohit Sharma)'))
        self.stdout.write(self.style.SUCCESS('[Mentee 3] mentee_dinesh / dinesh123 (Dinesh Meena)'))
        self.stdout.write(self.style.SUCCESS('[Bad Actor] crypto_spammer / spammer123 (Reported for Chat Analysis)'))
        self.stdout.write(self.style.SUCCESS('====================================================='))


