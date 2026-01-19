# backend/students/serializers.py - CORRIGÉ

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Student

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'phone', 'date_of_birth']

class StudentWriteSerializer(serializers.ModelSerializer):
    # Champs pour la création/mise à jour
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    date_of_birth = serializers.DateField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Student
        fields = [
            'id', 'student_id', 'enrollment_date', 'graduation_date',
            'faculty', 'department', 'current_year', 'gpa', 'status',
            'first_name', 'last_name', 'email', 'phone', 'date_of_birth'
        ]
    
    def create(self, validated_data):
        """Créer un étudiant avec un utilisateur associé"""
        # Extraire les données utilisateur
        user_data = {
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'email': validated_data.pop('email'),
            'phone': validated_data.pop('phone', ''),
            'date_of_birth': validated_data.pop('date_of_birth', None)
        }
        
        # ✅ IMPORTANT: Générer un username unique basé sur l'email
        # Le username est requis et doit être unique
        base_username = user_data['email'].split('@')[0]  # Prendre la partie avant @
        username = base_username
        counter = 1
        
        # Vérifier que le username est unique
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        
        user_data['username'] = username
        
        # Vérifier si l'email existe déjà
        if User.objects.filter(email=user_data['email']).exists():
            raise serializers.ValidationError(
                {'email': 'Cet email est déjà utilisé.'}
            )
        
        # Créer l'utilisateur
        user = User.objects.create(**user_data)
        print(f"✅ Utilisateur créé: {user.username} ({user.email})")
        
        # Créer l'étudiant
        student = Student.objects.create(user=user, **validated_data)
        print(f"✅ Étudiant créé: {student.student_id}")
        return student
    
    def update(self, instance, validated_data):
        """Mettre à jour un étudiant et son utilisateur associé"""
        # Mettre à jour l'utilisateur
        user = instance.user
        
        # Extraire les données utilisateur
        first_name = validated_data.pop('first_name', None)
        last_name = validated_data.pop('last_name', None)
        email = validated_data.pop('email', None)
        phone = validated_data.pop('phone', None)
        date_of_birth = validated_data.pop('date_of_birth', None)
        
        # Mettre à jour les champs de l'utilisateur
        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name
        if email is not None and email != user.email:
            # Vérifier que le nouvel email n'existe pas
            if User.objects.filter(email=email).exclude(id=user.id).exists():
                raise serializers.ValidationError(
                    {'email': 'Cet email est déjà utilisé.'}
                )
            user.email = email
        if phone is not None:
            user.phone = phone
        if date_of_birth is not None:
            user.date_of_birth = date_of_birth
        
        user.save()
        print(f"✅ Utilisateur mis à jour: {user.username}")
        
        # Mettre à jour les champs de l'étudiant
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        print(f"✅ Étudiant mis à jour: {instance.student_id}")
        return instance

class StudentReadSerializer(serializers.ModelSerializer):
    # Champs pour la lecture
    user = UserSerializer(read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    date_of_birth = serializers.DateField(source='user.date_of_birth', read_only=True)
    
    class Meta:
        model = Student
        fields = [
            'id', 'user', 'student_id', 'first_name', 'last_name', 'email', 
            'phone', 'date_of_birth', 'enrollment_date', 'graduation_date',
            'faculty', 'department', 'current_year', 'gpa', 'status'
        ]