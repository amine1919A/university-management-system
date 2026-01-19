from django.db import models
from django.core.validators import MinValueValidator
from students.models import Student
from teachers.models import Teacher
import uuid
from datetime import datetime, date
from django.utils import timezone


# backend/finance/models.py - Section Transaction

class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ('tuition', 'Frais de scolarité'),
        ('exam_fee', 'Frais d\'examen'),
        ('library_fee', 'Frais de bibliothèque'),
        ('lab_fee', 'Frais de laboratoire'),
        ('scholarship', 'Bourse d\'études'),
        ('refund', 'Remboursement'),
        ('salary', 'Salaire enseignant'),
        ('maintenance', 'Maintenance'),
        ('equipment', 'Équipement'),
        ('other', 'Autre'),
    ]
    
    STATUS_CHOICES = [
        ('paid', 'Payé'),
        ('pending', 'En attente'),
        ('overdue', 'En retard'),
        ('cancelled', 'Annulé'),
        ('partial', 'Partiel'),
    ]
    
    METHOD_CHOICES = [
        ('bank_transfer', 'Virement bancaire'),
        ('credit_card', 'Carte de crédit'),
        ('cash', 'Espèces'),
        ('check', 'Chèque'),
        ('mobile_payment', 'Paiement mobile'),
    ]
    
    CATEGORY_CHOICES = [
        ('income', 'Revenu'),
        ('expense', 'Dépense'),
        ('scholarship', 'Bourse'),
        ('salary', 'Salaire'),
    ]
    
    # ID avec UUID
    id = models.AutoField(primary_key=True)
    
    # Numéro de transaction
    transaction_number = models.CharField(max_length=50, unique=True, null=True, blank=True)
    
    # Relations
    student = models.ForeignKey(
        Student, 
        on_delete=models.CASCADE, 
        related_name='transactions', 
        null=True, 
        blank=True,
        db_column='student_id'
    )
    
    teacher = models.ForeignKey(
        Teacher, 
        on_delete=models.CASCADE, 
        related_name='salary_transactions', 
        null=True, 
        blank=True
    )
    
    # Informations de base
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='income')
    amount = models.DecimalField(max_digits=12, decimal_places=3, validators=[MinValueValidator(0.001)])
    paid_amount = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    
    # Dates
    date = models.DateField(default=date.today)
    due_date = models.DateField(null=True, blank=True)
    payment_date = models.DateField(null=True, blank=True)
    
    # Statut et méthode
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    method = models.CharField(max_length=20, choices=METHOD_CHOICES, blank=True)
    
    # Informations supplémentaires
    description = models.TextField(blank=True)
    receipt_number = models.CharField(max_length=50, blank=True)
    invoice_number = models.CharField(max_length=50, blank=True)
    
    # Récurrence
    is_recurring = models.BooleanField(default=False)
    recurrence_period = models.CharField(max_length=20, blank=True, choices=[
        ('monthly', 'Mensuel'),
        ('quarterly', 'Trimestriel'),
        ('yearly', 'Annuel'),
    ])
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date']
        # ✅ PAS D'INDEXES - Tout commenté ou supprimé
    
    def __str__(self):
        try:
            if self.student and hasattr(self.student, 'student_id'):
                student_id = self.student.student_id
                return f"{self.transaction_number or 'N/A'} - {student_id} - {self.get_transaction_type_display()}"
            elif self.teacher and hasattr(self.teacher, 'teacher_id'):
                teacher_id = self.teacher.teacher_id
                return f"{self.transaction_number or 'N/A'} - {teacher_id} - {self.get_transaction_type_display()}"
            else:
                return f"{self.transaction_number or 'N/A'} - {self.get_transaction_type_display()}"
        except Exception:
            return f"Transaction {str(self.id)[:8]}"
    
    def save(self, *args, **kwargs):
        from datetime import datetime as dt
        
        if not self.transaction_number and self._state.adding:
            self._generate_transaction_number()
        
        self._determine_category()
        self._calculate_status()
        self._validate_amounts()
        
        super().save(*args, **kwargs)
    
    def _generate_transaction_number(self):
        from datetime import datetime as dt
        
        try:
            prefix = 'TRN'
            year = str(self.date.year)[2:] if self.date else str(dt.now().year)[2:]
            timestamp = int(dt.now().timestamp())
            random_part = str(timestamp)[-6:]
            self.transaction_number = f"{prefix}{year}{random_part}"
        except Exception:
            self.transaction_number = f"TRN{str(dt.now().timestamp()).replace('.', '')[:10]}"
    
    def _determine_category(self):
        if not self.category or self.category == 'income':
            if self.transaction_type in ['scholarship', 'refund']:
                self.category = 'scholarship'
            elif self.transaction_type == 'salary':
                self.category = 'salary'
            elif self.transaction_type in ['tuition', 'exam_fee', 'library_fee', 'lab_fee']:
                self.category = 'income'
            else:
                self.category = 'expense'
    
    def _calculate_status(self):
        from datetime import date
        
        if self.paid_amount >= self.amount:
            self.status = 'paid'
            if not self.payment_date:
                self.payment_date = date.today()
        elif self.paid_amount > 0:
            self.status = 'partial'
        
        if (self.due_date and self.due_date < date.today() and 
            self.status not in ['paid', 'cancelled']):
            self.status = 'overdue'
    
    def _validate_amounts(self):
        if self.paid_amount > self.amount:
            self.paid_amount = self.amount
    
    def get_remaining_amount(self):
        try:
            amount = float(self.amount) if self.amount else 0
            paid = float(self.paid_amount) if self.paid_amount else 0
            return amount - paid
        except (ValueError, TypeError):
            return 0
    
    @property
    def remaining_amount(self):
        return self.get_remaining_amount()
    
    @property
    def is_overdue(self):
        from datetime import date
        try:
            if (self.due_date and self.due_date < date.today() and 
                self.status not in ['paid', 'cancelled']):
                return True
            return False
        except Exception:
            return False
    
    @property
    def days_overdue(self):
        from datetime import date
        try:
            if self.is_overdue:
                return (date.today() - self.due_date).days
            return 0
        except Exception:
            return 0
    
    @property
    def payment_percentage(self):
        try:
            if self.amount and float(self.amount) > 0:
                amount = float(self.amount)
                paid = float(self.paid_amount) if self.paid_amount else 0
                return round((paid / amount) * 100, 2)
            return 0
        except (ValueError, TypeError, ZeroDivisionError):
            return 0
            

# backend/finance/models.py - Section Budget à modifier

class Budget(models.Model):
    DEPARTMENT_CHOICES = [
        ('engineering', 'Faculté d\'Ingénierie'),
        ('medicine', 'Faculté de Médecine'),
        ('sciences', 'Faculté des Sciences'),
        ('arts', 'Faculté des Arts'),
        ('economics', 'Faculté d\'Économie'),
        ('law', 'Faculté de Droit'),
        ('administration', 'Administration Générale'),
        ('it', 'Centre Informatique'),
        ('library', 'Bibliothèque Centrale'),
        ('student_affairs', 'Affaires Étudiantes'),
        ('maintenance', 'Maintenance'),
        ('salaries', 'Salaires'),
    ]
    
    BUDGET_TYPE_CHOICES = [
        ('operational', 'Opérationnel'),
        ('capital', 'Capital'),
        ('salary', 'Salaires'),
        ('scholarship', 'Bourses'),
        ('development', 'Développement'),
    ]
    
    department = models.CharField(max_length=50, choices=DEPARTMENT_CHOICES)
    budget_type = models.CharField(max_length=20, choices=BUDGET_TYPE_CHOICES, default='operational')
    year = models.IntegerField(default=datetime.now().year)
    allocated_amount = models.DecimalField(max_digits=15, decimal_places=3, validators=[MinValueValidator(0.001)])
    spent_amount = models.DecimalField(max_digits=15, decimal_places=3, default=0)
    committed_amount = models.DecimalField(max_digits=15, decimal_places=3, default=0)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        # ⚠️ IMPORTANT: Permettre les doublons en supprimant unique_together
        # Si vous avez vraiment besoin de l'unicité, utilisez une contrainte conditionnelle
        ordering = ['-year', 'department']
    
    def __str__(self):
        return f"Budget {self.department} - {self.budget_type} - {self.year}"
    
    @property
    def remaining_amount(self):
        return self.allocated_amount - self.spent_amount - self.committed_amount
    
    @property
    def utilization_percentage(self):
        if self.allocated_amount > 0:
            return round((self.spent_amount / self.allocated_amount) * 100, 2)
        return 0
    
    @property
    def available_amount(self):
        return self.allocated_amount - self.spent_amount
    
    @property
    def commitment_percentage(self):
        if self.allocated_amount > 0:
            return round((self.committed_amount / self.allocated_amount) * 100, 2)
        return 0
    
    def can_spend(self, amount):
        """Vérifier si un montant peut être dépensé"""
        available = self.available_amount - self.committed_amount
        return available >= amount
    
    def commit_amount(self, amount):
        """Engager un montant"""
        if self.can_spend(amount):
            self.committed_amount += amount
            self.save()
            return True
        return False
    
    def release_commitment(self, amount):
        """Libérer un engagement"""
        if self.committed_amount >= amount:
            self.committed_amount -= amount
            self.save()
            return True
        return False
    
    def spend_amount(self, amount):
        """Dépenser un montant (réel)"""
        if self.spent_amount + amount <= self.allocated_amount:
            self.spent_amount += amount
            # Libérer l'engagement correspondant si nécessaire
            if self.committed_amount >= amount:
                self.committed_amount -= amount
            elif self.committed_amount > 0:
                # Si l'engagement est partiel
                amount -= self.committed_amount
                self.committed_amount = 0
            self.save()
            return True
        return False

class Salary(models.Model):
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='salaries')
    month = models.IntegerField(choices=[(i, i) for i in range(1, 13)], default=datetime.now().month)
    year = models.IntegerField(default=datetime.now().year)
    base_salary = models.DecimalField(max_digits=10, decimal_places=3)
    bonus = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    deductions = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    net_salary = models.DecimalField(max_digits=10, decimal_places=3)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'En attente'),
        ('paid', 'Payé'),
        ('processing', 'En traitement'),
        ('cancelled', 'Annulé'),
    ], default='pending')
    payment_date = models.DateField(null=True, blank=True)
    payment_method = models.CharField(max_length=20, choices=Transaction.METHOD_CHOICES, blank=True)
    transaction = models.OneToOneField(Transaction, on_delete=models.SET_NULL, null=True, blank=True, related_name='salary_payment')
    comments = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['teacher', 'month', 'year']
        ordering = ['-year', '-month']
    
    def __str__(self):
        teacher_id = getattr(self.teacher, 'teacher_id', 'N/A') if self.teacher else 'N/A'
        return f"Salaire {teacher_id} - {self.month}/{self.year}"
    
    def save(self, *args, **kwargs):
        if not self.net_salary:
            self.net_salary = self.base_salary + self.bonus - self.deductions
        
        # Mettre à jour la date de paiement si le statut est 'paid'
        if self.status == 'paid' and not self.payment_date:
            self.payment_date = date.today()
        
        super().save(*args, **kwargs)
    
    @property
    def month_name(self):
        month_names = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ]
        return month_names[self.month - 1] if 1 <= self.month <= 12 else ''
    
    @property
    def gross_salary(self):
        return self.base_salary + self.bonus
    
    @property
    def tax_percentage(self):
        if self.gross_salary > 0:
            return round((self.deductions / self.gross_salary) * 100, 2)
        return 0

class FinancialReport(models.Model):
    REPORT_TYPE_CHOICES = [
        ('daily', 'Journalier'),
        ('weekly', 'Hebdomadaire'),
        ('monthly', 'Mensuel'),
        ('quarterly', 'Trimestriel'),
        ('yearly', 'Annuel'),
    ]
    
    report_type = models.CharField(max_length=50, choices=REPORT_TYPE_CHOICES)
    period_start = models.DateField()
    period_end = models.DateField()
    total_income = models.DecimalField(max_digits=15, decimal_places=3, default=0)
    total_expenses = models.DecimalField(max_digits=15, decimal_places=3, default=0)
    total_salaries = models.DecimalField(max_digits=15, decimal_places=3, default=0)
    total_scholarships = models.DecimalField(max_digits=15, decimal_places=3, default=0)
    net_balance = models.DecimalField(max_digits=15, decimal_places=3, default=0)
    generated_at = models.DateTimeField(auto_now_add=True)
    generated_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True)
    file_path = models.FileField(upload_to='financial_reports/', null=True, blank=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-period_end']
    
    def __str__(self):
        return f"Rapport {self.report_type} - {self.period_start} au {self.period_end}"
    
    @property
    def period_duration(self):
        return (self.period_end - self.period_start).days + 1
    
    @property
    def daily_average_income(self):
        if self.period_duration > 0:
            return round(float(self.total_income) / self.period_duration, 3)
        return 0
    
    @property
    def daily_average_expenses(self):
        if self.period_duration > 0:
            return round(float(self.total_expenses) / self.period_duration, 3)
        return 0
    
    @property
    def profit_margin(self):
        if self.total_income > 0:
            margin = ((float(self.total_income) - float(self.total_expenses + self.total_salaries + self.total_scholarships)) / 
                     float(self.total_income)) * 100
            return round(margin, 2)
        return 0
    
    def generate_summary(self):
        """Générer un résumé du rapport"""
        return {
            'période': f"{self.period_start} au {self.period_end}",
            'type': self.get_report_type_display(),
            'durée_jours': self.period_duration,
            'revenus_total': float(self.total_income),
            'dépenses_total': float(self.total_expenses),
            'salaires_total': float(self.total_salaries),
            'bourses_total': float(self.total_scholarships),
            'solde_net': float(self.net_balance),
            'marge_bénéfice': f"{self.profit_margin}%",
            'revenu_moyen_journalier': self.daily_average_income,
            'dépense_moyenne_journalière': self.daily_average_expenses,
            'généré_le': self.generated_at.strftime('%d/%m/%Y %H:%M'),
        }

class PaymentReminder(models.Model):
    transaction = models.ForeignKey(
        Transaction, 
        on_delete=models.SET_NULL,  # CHANGER DE CASCADE À SET_NULL
        related_name='reminders',
        null=True,  # AJOUTER null=True
        blank=True  # AJOUTER blank=True
    )
    reminder_date = models.DateField()
    reminder_type = models.CharField(max_length=20, choices=[
        ('first', 'Premier rappel'),
        ('second', 'Deuxième rappel'),
        ('final', 'Rappel final'),
        ('overdue', 'En retard'),
    ])
    sent_at = models.DateTimeField(null=True, blank=True)
    sent_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-reminder_date']
    
    def __str__(self):
        return f"Rappel {self.reminder_type} - {self.transaction.transaction_number or 'N/A'} - {self.reminder_date}"

class FinancialSetting(models.Model):
    setting_key = models.CharField(max_length=100, unique=True)
    setting_value = models.TextField()
    setting_type = models.CharField(max_length=50, choices=[
        ('string', 'Texte'),
        ('number', 'Nombre'),
        ('boolean', 'Booléen'),
        ('json', 'JSON'),
        ('date', 'Date'),
    ], default='string')
    description = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['setting_key']
    
    def __str__(self):
        return self.setting_key
    
    def get_value(self):
        """Obtenir la valeur dans le bon type"""
        if self.setting_type == 'number':
            try:
                return float(self.setting_value) if '.' in self.setting_value else int(self.setting_value)
            except ValueError:
                return 0
        elif self.setting_type == 'boolean':
            return self.setting_value.lower() in ['true', '1', 'yes', 'oui']
        elif self.setting_type == 'json':
            try:
                import json
                return json.loads(self.setting_value)
            except:
                return {}
        elif self.setting_type == 'date':
            try:
                from datetime import datetime
                return datetime.strptime(self.setting_value, '%Y-%m-%d').date()
            except:
                return None
        else:
            return self.setting_value