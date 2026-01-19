from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Teacher

User = get_user_model()

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'user_type', 'password']
        extra_kwargs = {
            'username': {'required': False},  # Facultatif
            'password': {'write_only': True, 'required': False},
            'user_type': {'required': False}
        }
    
    def create(self, validated_data):
        email = validated_data.get('email')
        
        # Générer un username unique
        username = validated_data.get('username', email)
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        
        validated_data['username'] = username
        
        # Définir user_type
        if 'user_type' not in validated_data:
            validated_data['user_type'] = 'teacher'
        
        # Créer l'utilisateur
        user = User.objects.create_user(
            username=username,
            email=email,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=validated_data.get('password', 'defaultpassword123'),
            user_type=validated_data.get('user_type', 'teacher'),
            phone=validated_data.get('phone', ''),
            date_of_birth=validated_data.get('date_of_birth', None)
        )
        
        return user

class TeacherSerializer(serializers.ModelSerializer):
    # Champs utilisateur pour la création/mise à jour
    first_name = serializers.CharField(write_only=True, required=True)
    last_name = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(write_only=True, required=True)
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    date_of_birth = serializers.DateField(write_only=True, required=False, allow_null=True)
    
    # Champs calculés pour le username
    username = serializers.SerializerMethodField(read_only=True)
    
    # Pour la lecture
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_phone = serializers.CharField(source='user.phone', read_only=True, allow_null=True)
    user_date_of_birth = serializers.DateField(source='user.date_of_birth', read_only=True, allow_null=True)
    
    class Meta:
        model = Teacher
        fields = [
            'id', 'teacher_id', 'hire_date', 'department', 'specialization',
            'rank', 'office_number', 'office_hours',
            'first_name', 'last_name', 'email', 'phone', 'date_of_birth',
            'username',
            'user_first_name', 'user_last_name', 'user_email', 
            'user_phone', 'user_date_of_birth'
        ]
        extra_kwargs = {
            'teacher_id': {'required': True},
            'hire_date': {'required': True},
            'department': {'required': True},
            'specialization': {'required': True},
            'rank': {'required': True},
        }
    
    def get_username(self, obj):
        return obj.user.username if obj.user else None
    
    def validate_teacher_id(self, value):
        # Pour la création uniquement, vérifier l'unicité
        if self.instance is None and Teacher.objects.filter(teacher_id=value).exists():
            raise serializers.ValidationError("Cet ID enseignant existe déjà.")
        return value
    
    def validate_email(self, value):
        # Pour la création uniquement, vérifier l'unicité
        if self.instance is None and User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        return value
    
    def create(self, validated_data):
        try:
            print("🔧 Début création enseignant...")
            
            # Extraire les données utilisateur
            user_data = {
                'first_name': validated_data.pop('first_name'),
                'last_name': validated_data.pop('last_name'),
                'email': validated_data.pop('email'),
                'phone': validated_data.pop('phone', ''),
                'date_of_birth': validated_data.pop('date_of_birth', None)
            }
            
            print(f"📋 Données utilisateur: {user_data}")
            print(f"📋 Données enseignant: {validated_data}")
            
            # Créer l'utilisateur avec UserCreateSerializer
            user_serializer = UserCreateSerializer(data=user_data)
            
            if user_serializer.is_valid():
                user = user_serializer.save()
                print(f"✅ Utilisateur créé: {user.username} ({user.email})")
            else:
                print(f"❌ Erreurs UserCreateSerializer: {user_serializer.errors}")
                # Si l'erreur est liée au username, régénérer manuellement
                if 'username' in user_serializer.errors:
                    # Créer l'utilisateur directement
                    email = user_data['email']
                    username = email
                    counter = 1
                    while User.objects.filter(username=username).exists():
                        username = f"{email}{counter}"
                        counter += 1
                    
                    user = User.objects.create_user(
                        username=username,
                        email=email,
                        first_name=user_data['first_name'],
                        last_name=user_data['last_name'],
                        password='defaultpassword123',
                        user_type='teacher',
                        phone=user_data.get('phone', ''),
                        date_of_birth=user_data.get('date_of_birth')
                    )
                    print(f"✅ Utilisateur créé manuellement: {user.username}")
                else:
                    raise serializers.ValidationError({
                        'user_errors': user_serializer.errors
                    })
            
            # Créer l'enseignant
            teacher = Teacher.objects.create(user=user, **validated_data)
            print(f"✅ Enseignant créé: {teacher.teacher_id}")
            
            return teacher
            
        except Exception as e:
            print(f"❌ Exception dans TeacherSerializer.create: {str(e)}")
            import traceback
            traceback.print_exc()
            raise serializers.ValidationError(f"Erreur lors de la création: {str(e)}")
    
    def update(self, instance, validated_data):
        try:
            # Mettre à jour l'utilisateur si des données sont fournies
            user = instance.user
            
            if 'first_name' in validated_data:
                user.first_name = validated_data.pop('first_name')
            if 'last_name' in validated_data:
                user.last_name = validated_data.pop('last_name')
            if 'email' in validated_data:
                new_email = validated_data.pop('email')
                if new_email != user.email:
                    # Vérifier si le nouvel email est déjà utilisé
                    if User.objects.filter(email=new_email).exclude(id=user.id).exists():
                        raise serializers.ValidationError({
                            'email': 'Cet email est déjà utilisé par un autre utilisateur.'
                        })
                    user.email = new_email
                    user.username = new_email  # Mettre à jour le username
            
            if 'phone' in validated_data:
                user.phone = validated_data.pop('phone', '')
            if 'date_of_birth' in validated_data:
                user.date_of_birth = validated_data.pop('date_of_birth')
            
            user.save()
            
            # Mettre à jour l'enseignant
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            
            instance.save()
            
            return instance
            
        except Exception as e:
            raise serializers.ValidationError(f"Erreur lors de la mise à jour: {str(e)}")