# finance/serializers.py - CORRIGÉ

from rest_framework import serializers
from .models import Transaction, Budget, Salary, FinancialReport
from students.models import Student
from teachers.models import Teacher
from django.contrib.auth import get_user_model
from datetime import datetime, date
import decimal

User = get_user_model()

class StudentSimpleSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = ['id', 'student_id', 'full_name', 'email', 'faculty', 'department', 'current_year']
    
    def get_full_name(self, obj):
        if obj and obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}"
        return "Inconnu"
    
    def get_email(self, obj):
        if obj and obj.user:
            return obj.user.email
        return ""

class TeacherSimpleSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    
    class Meta:
        model = Teacher
        fields = ['id', 'teacher_id', 'full_name', 'email', 'department', 'specialization', 'rank']
    
    def get_full_name(self, obj):
        if obj and obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}"
        return "Inconnu"
    
    def get_email(self, obj):
        if obj and obj.user:
            return obj.user.email
        return ""

class TransactionSerializer(serializers.ModelSerializer):
    """Serializer principal pour les transactions"""
    student_name = serializers.SerializerMethodField()
    teacher_name = serializers.SerializerMethodField()
    remaining_amount = serializers.SerializerMethodField(read_only=True)
    is_overdue = serializers.SerializerMethodField(read_only=True)
    days_overdue = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_number', 'transaction_type', 'category',
            'student', 'student_name', 'teacher', 'teacher_name',
            'amount', 'paid_amount', 'remaining_amount', 'date', 'due_date', 'payment_date',
            'status', 'method', 'description', 'receipt_number', 'invoice_number',
            'is_recurring', 'recurrence_period', 'is_overdue', 'days_overdue',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['transaction_number', 'created_at', 'updated_at', 'remaining_amount']
    
    def get_student_name(self, obj):
        if obj.student and hasattr(obj.student, 'user'):
            try:
                return f"{obj.student.user.first_name} {obj.student.user.last_name}"
            except:
                return str(obj.student_id) if obj.student_id else ""
        return str(obj.student_id) if obj.student_id else ""
    
    def get_teacher_name(self, obj):
        if obj.teacher and hasattr(obj.teacher, 'user'):
            try:
                return f"{obj.teacher.user.first_name} {obj.teacher.user.last_name}"
            except:
                return str(obj.teacher_id) if obj.teacher_id else ""
        return str(obj.teacher_id) if obj.teacher_id else ""
    
    def get_remaining_amount(self, obj):
        try:
            amount = float(obj.amount) if obj.amount else 0
            paid = float(obj.paid_amount) if obj.paid_amount else 0
            return amount - paid
        except:
            return 0
    
    def get_is_overdue(self, obj):
        try:
            from datetime import date
            if obj.due_date and obj.due_date < date.today() and obj.status not in ['paid', 'cancelled']:
                return True
            return False
        except:
            return False
    
    def get_days_overdue(self, obj):
        try:
            from datetime import date
            if obj.due_date and obj.due_date < date.today() and obj.status not in ['paid', 'cancelled']:
                return (date.today() - obj.due_date).days
            return 0
        except:
            return 0
    
    def validate(self, data):
        """Validation globale de la transaction"""
        student = data.get('student')
        teacher = data.get('teacher')
        transaction_type = data.get('transaction_type')
        
        # Pour les salaires, vérifier qu'un enseignant est associé
        if transaction_type == 'salary' and not teacher:
            raise serializers.ValidationError({
                'teacher': 'Les transactions de type salaire doivent être associées à un enseignant.'
            })
        
        # Pour les frais étudiants, vérifier qu'un étudiant est associé
        if transaction_type in ['tuition', 'exam_fee', 'library_fee', 'lab_fee'] and not student:
            raise serializers.ValidationError({
                'student': f'Les transactions de type {transaction_type} doivent être associées à un étudiant.'
            })
        
        return data
    
    def validate_amount(self, value):
        """Validation du montant"""
        if value <= 0:
            raise serializers.ValidationError("Le montant doit être positif.")
        return value
    
    def create(self, validated_data):
        # Déterminer automatiquement la catégorie
        transaction_type = validated_data.get('transaction_type')
        if transaction_type in ['scholarship', 'refund']:
            validated_data['category'] = 'scholarship'
        elif transaction_type == 'salary':
            validated_data['category'] = 'salary'
        elif transaction_type in ['tuition', 'exam_fee', 'library_fee', 'lab_fee']:
            validated_data['category'] = 'income'
        elif 'category' not in validated_data:
            validated_data['category'] = 'expense'
        
        # Définir le statut par défaut
        if 'status' not in validated_data:
            validated_data['status'] = 'pending'
        
        return super().create(validated_data)

class TransactionCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création de transactions"""
    class Meta:
        model = Transaction
        fields = [
            'student', 'teacher', 'transaction_type', 'category', 'amount',
            'date', 'due_date', 'status', 'method', 'description',
            'is_recurring', 'recurrence_period'
        ]
    
    def create(self, validated_data):
        # Déterminer automatiquement la catégorie
        transaction_type = validated_data.get('transaction_type')
        if transaction_type in ['scholarship', 'refund']:
            validated_data['category'] = 'scholarship'
        elif transaction_type == 'salary':
            validated_data['category'] = 'salary'
        elif transaction_type in ['tuition', 'exam_fee', 'library_fee', 'lab_fee']:
            validated_data['category'] = 'income'
        elif 'category' not in validated_data:
            validated_data['category'] = 'expense'
        
        return super().create(validated_data)

# Dans finance/serializers.py, modifiez BudgetSerializer:

class BudgetSerializer(serializers.ModelSerializer):
    remaining_amount = serializers.SerializerMethodField()
    available_amount = serializers.SerializerMethodField()
    utilization_percentage = serializers.SerializerMethodField()
    department_display = serializers.SerializerMethodField()
    budget_type_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Budget
        fields = [
            'id', 'department', 'department_display', 'budget_type', 'budget_type_display',
            'year', 'allocated_amount', 'spent_amount', 'committed_amount',
            'remaining_amount', 'available_amount', 'utilization_percentage',
            'description', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    # IMPORTANT: S'assurer que department utilise la clé, pas le libellé
    def validate_department(self, value):
        """Valider que le département utilise la clé correcte"""
        valid_choices = ['engineering', 'medicine', 'sciences', 'arts', 'economics', 'law',
                        'administration', 'it', 'library', 'student_affairs', 'maintenance', 'salaries']
        
        if value not in valid_choices:
            raise serializers.ValidationError(
                f"'{value}' n'est pas un choix valide. Utilisez l'une des valeurs: {', '.join(valid_choices)}"
            )
        return value
    
    def get_remaining_amount(self, obj):
        try:
            if hasattr(obj, 'remaining_amount'):
                return float(obj.remaining_amount) if obj.remaining_amount is not None else 0
            allocated = float(obj.allocated_amount) if obj.allocated_amount else 0
            spent = float(obj.spent_amount) if obj.spent_amount else 0
            committed = float(obj.committed_amount) if obj.committed_amount else 0
            return allocated - spent - committed
        except (ValueError, TypeError, AttributeError):
            return 0
    
    def get_available_amount(self, obj):
        try:
            if hasattr(obj, 'available_amount'):
                return float(obj.available_amount) if obj.available_amount is not None else 0
            allocated = float(obj.allocated_amount) if obj.allocated_amount else 0
            spent = float(obj.spent_amount) if obj.spent_amount else 0
            return allocated - spent
        except (ValueError, TypeError, AttributeError):
            return 0
    
    def get_utilization_percentage(self, obj):
        try:
            if hasattr(obj, 'utilization_percentage'):
                return float(obj.utilization_percentage) if obj.utilization_percentage is not None else 0
            
            allocated = float(obj.allocated_amount) if obj.allocated_amount else 0
            spent = float(obj.spent_amount) if obj.spent_amount else 0
            
            if allocated > 0:
                return round((spent / allocated) * 100, 2)
            return 0
        except (ValueError, TypeError, AttributeError, ZeroDivisionError):
            return 0
    
    def get_department_display(self, obj):
        """Retourner UNIQUEMENT la clé, pas le libellé"""
        return obj.department
    
    def get_budget_type_display(self, obj):
        """Retourner UNIQUEMENT la clé, pas le libellé"""
        return obj.budget_type

class SalarySerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Salary
        fields = [
            'id', 'teacher', 'teacher_name', 'month', 'year',
            'base_salary', 'bonus', 'deductions', 'net_salary',
            'status', 'status_display', 'payment_date', 'payment_method',
            'transaction', 'comments', 'created_at', 'updated_at'
        ]
        read_only_fields = ['net_salary', 'created_at', 'updated_at']
    
    def get_teacher_name(self, obj):
        if obj.teacher:
            try:
                return f"{obj.teacher.user.first_name} {obj.teacher.user.last_name}"
            except:
                return str(obj.teacher_id) if obj.teacher_id else ""
        return ""
    
    def get_status_display(self, obj):
        try:
            return obj.get_status_display() if obj.status else obj.status
        except:
            return obj.status

class FinancialReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinancialReport
        fields = '__all__'
        read_only_fields = ['generated_at', 'generated_by']

class FinanceStatisticsSerializer(serializers.Serializer):
    total_income = serializers.DecimalField(max_digits=15, decimal_places=3, default=0)
    total_expenses = serializers.DecimalField(max_digits=15, decimal_places=3, default=0)
    total_salaries = serializers.DecimalField(max_digits=15, decimal_places=3, default=0)
    total_scholarships = serializers.DecimalField(max_digits=15, decimal_places=3, default=0)
    net_balance = serializers.DecimalField(max_digits=15, decimal_places=3, default=0)
    pending_transactions = serializers.IntegerField(default=0)
    overdue_transactions = serializers.IntegerField(default=0)
    pending_amount = serializers.DecimalField(max_digits=15, decimal_places=3, default=0)
    overdue_amount = serializers.DecimalField(max_digits=15, decimal_places=3, default=0)
    monthly_income = serializers.ListField(child=serializers.DictField(), default=[])
    monthly_expenses = serializers.ListField(child=serializers.DictField(), default=[])
    transaction_distribution = serializers.ListField(child=serializers.DictField(), default=[])
    budget_utilization = serializers.ListField(child=serializers.DictField(), default=[])