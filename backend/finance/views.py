# backend/finance/views.py - VERSION CORRIGÉE

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Q
from datetime import datetime, date, timedelta
import calendar
import traceback
from django.http import HttpResponse
import csv
from decimal import Decimal
from django.db import connection
# Import correct des modèles et serializers
from .models import Transaction, Budget, Salary, FinancialReport
from .serializers import (
    TransactionSerializer, TransactionCreateSerializer,
    BudgetSerializer, SalarySerializer, FinancialReportSerializer,
    FinanceStatisticsSerializer
)

# backend/finance/views.py - TRANSACTION VIEWSET CORRIGÉ

class TransactionViewSet(viewsets.ModelViewSet):
    """ViewSet pour les transactions - VERSION CORRIGÉE COMPLÈTE"""
    queryset = Transaction.objects.all().order_by('-date')
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['transaction_type', 'category', 'status', 'method']
    search_fields = ['transaction_number', 'description', 'student__user__first_name', 
                     'student__user__last_name', 'teacher__user__first_name', 
                     'teacher__user__last_name']
    ordering_fields = ['date', 'due_date', 'amount', 'status']
    
    def get_queryset(self):
        queryset = Transaction.objects.all().select_related('student', 'student__user', 
                                                           'teacher', 'teacher__user')
        
        # Filtres
        student_id = self.request.query_params.get('student')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        
        teacher_id = self.request.query_params.get('teacher')
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)
        
        is_overdue = self.request.query_params.get('is_overdue')
        if is_overdue == 'true':
            from datetime import date
            queryset = queryset.filter(
                due_date__lt=date.today(),
                status__in=['pending', 'partial']
            )
        
        return queryset.order_by('-date')
    
    def retrieve(self, request, *args, **kwargs):
        """Récupérer une transaction spécifique - VERSION DEBUG"""
        try:
            print(f"🔍 Fetching transaction with id: {kwargs.get('pk')}")
            instance = self.get_object()
            print(f"📊 Transaction found: {instance}")
            serializer = self.get_serializer(instance)
            print(f"📋 Serialized data: {serializer.data}")
            return Response(serializer.data)
        except Exception as e:
            print(f"❌ Error retrieving transaction: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'success': False,
                'error': 'Transaction not found',
                'detail': str(e)
            }, status=status.HTTP_404_NOT_FOUND)
    
    def destroy(self, request, *args, **kwargs):
        """Supprimer une transaction - VERSION SIMPLIFIÉE"""
        try:
            transaction_id = kwargs.get('pk')
            print(f"🗑️ Suppression de la transaction {transaction_id}")
        
        # SUPPRESSION DIRECTE SANS CONTRAINTES
            with connection.cursor() as cursor:
            # D'abord, essayer de supprimer les PaymentReminder liés (sans vérifier si la table existe)
                try:
                    cursor.execute(
                        "DELETE FROM finance_paymentreminder WHERE transaction_id = %s",
                        [transaction_id]
                    )
                    print(f"✅ Rappels liés supprimés: {cursor.rowcount}")
                except Exception as e:
                # Si la table n'existe pas, continuer
                    if 'no such table' in str(e):
                        print("ℹ️ Table paymentreminder n'existe pas - ignorée")
                    else:
                        print(f"⚠️ Erreur suppression rappels: {e}")
            
            # Supprimer la transaction
                cursor.execute(
                    "DELETE FROM finance_transaction WHERE id = %s",
                    [transaction_id]
                )
            
                deleted_count = cursor.rowcount
            
                if deleted_count == 0:
                    return Response({
                        'success': False,
                        'error': 'Transaction non trouvée'
                    }, status=status.HTTP_404_NOT_FOUND)
        
            print(f"✅ Transaction {transaction_id} supprimée avec succès")
            return Response({
                'success': True,
                'message': f'Transaction {transaction_id} supprimée avec succès'
            })
        
        except Exception as e:
            print(f"❌ Erreur suppression transaction: {e}")
            import traceback
            traceback.print_exc()
        
            return Response({
                'success': False,
                'error': 'Erreur lors de la suppression',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def update(self, request, *args, **kwargs):
        """Mettre à jour une transaction - VERSION CORRIGÉE"""
        try:
            print(f"✏️ Updating transaction with id: {kwargs.get('pk')}")
            print(f"📋 Update data: {request.data}")
            
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            
            if serializer.is_valid():
                print(f"✅ Data is valid")
                self.perform_update(serializer)
                return Response(serializer.data)
            else:
                print(f"❌ Validation errors: {serializer.errors}")
                return Response({
                    'success': False,
                    'error': 'Erreur de validation',
                    'detail': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            print(f"❌ Error updating transaction: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'success': False,
                'error': 'Erreur lors de la mise à jour',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def partial_update(self, request, *args, **kwargs):
        """Mettre à jour partiellement une transaction"""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
    

# Ajouter cette vue pour tester les endpoints transactions

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def test_transactions(request):
    """Test endpoint pour vérifier que les transactions fonctionnent"""
    try:
        # Compter les transactions
        count = Transaction.objects.count()
        
        # Tester la création
        test_data = {
            'transaction_type': 'tuition',
            'amount': 1000.00,
            'date': date.today().isoformat(),
            'due_date': date.today().isoformat(),
            'status': 'pending',
            'description': 'Test transaction'
        }
        
        return Response({
            'success': True,
            'count': count,
            'endpoints': {
                'list': '/api/finance/transactions/',
                'detail': '/api/finance/transactions/{id}/',
                'create': '/api/finance/transactions/',
                'update': '/api/finance/transactions/{id}/',
                'delete': '/api/finance/transactions/{id}/'
            },
            'test_data': test_data
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class BudgetViewSet(viewsets.ModelViewSet):
    """ViewSet pour les budgets - VERSION DEBUG"""
    queryset = Budget.objects.all()
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request, *args, **kwargs):
        try:
            print("🔄 Tentative de récupération des budgets...")
            
            # Test simple
            test_budget = Budget.objects.first()
            if test_budget:
                print(f"📊 Premier budget trouvé: {test_budget}")
                print(f"  - allocated_amount: {test_budget.allocated_amount}, type: {type(test_budget.allocated_amount)}")
                print(f"  - spent_amount: {test_budget.spent_amount}, type: {type(test_budget.spent_amount)}")
                print(f"  - budget_type: {test_budget.budget_type}")
            
            queryset = self.filter_queryset(self.get_queryset())
            print(f"📊 Total budgets: {queryset.count()}")
            
            # Pagination
            page = self.paginate_queryset(queryset)
            if page is not None:
                print(f"📊 Page avec {len(page)} budgets")
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = self.get_serializer(queryset, many=True)
            print(f"📊 Serialization terminée")
            return Response(serializer.data)
            
        except Exception as e:
            print(f"❌ Erreur spécifique: {str(e)}")
            print(f"❌ Type d'erreur: {type(e)}")
            import traceback
            traceback.print_exc()
            
            # Retourner une version simplifiée pour debug
            try:
                budgets = Budget.objects.all()
                simple_data = []
                for budget in budgets:
                    simple_data.append({
                        'id': budget.id,
                        'department': budget.department,
                        'budget_type': budget.budget_type,
                        'year': budget.year,
                        'allocated_amount': str(budget.allocated_amount) if budget.allocated_amount else '0',
                        'spent_amount': str(budget.spent_amount) if budget.spent_amount else '0',
                        'committed_amount': str(budget.committed_amount) if budget.committed_amount else '0',
                        'description': budget.description,
                        'is_active': budget.is_active
                    })
                return Response({
                    'success': True,
                    'data': simple_data,
                    'debug': True
                })
            except Exception as inner_e:
                return Response({
                    'success': False,
                    'error': 'Erreur lors du chargement des budgets',
                    'detail': str(inner_e),
                    'original_error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def finance_statistics(request):
    """Statistiques financières complètes"""
    try:
        today = date.today()
        current_year = today.year
        
        # Transactions
        transactions = Transaction.objects.all()
        
        # Revenus (catégorie income)
        total_income = transactions.filter(
            category='income',
            status='paid'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Dépenses (catégorie expense)
        total_expenses = transactions.filter(
            category='expense',
            status='paid'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Salaires
        total_salaries = transactions.filter(
            category='salary',
            status='paid'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Bourses
        total_scholarships = transactions.filter(
            category='scholarship',
            status='paid'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # En attente
        pending_transactions = transactions.filter(status__in=['pending', 'partial'])
        pending_count = pending_transactions.count()
        pending_amount = pending_transactions.aggregate(total=Sum('amount'))['total'] or 0
        
        # En retard
        overdue_transactions = transactions.filter(
            due_date__lt=today,
            status__in=['pending', 'partial']
        )
        overdue_count = overdue_transactions.count()
        overdue_amount = overdue_transactions.aggregate(total=Sum('amount'))['total'] or 0
        
        # Répartition par type de transaction
        transaction_distribution = []
        try:
            transaction_distribution = list(transactions.filter(
                status='paid'
            ).values('transaction_type').annotate(
                total=Sum('amount'),
                count=Count('id')
            ).order_by('-total'))
        except Exception as e:
            print(f"⚠️ Erreur distribution: {e}")
        
        # Revenus mensuels (6 derniers mois)
        monthly_income = []
        monthly_expenses = []
        for i in range(5, -1, -1):
            month_date = today.replace(day=1) - timedelta(days=30*i)
            month_start = month_date.replace(day=1)
            month_end = (month_date.replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            month_income = transactions.filter(
                category='income',
                status='paid',
                date__range=[month_start, month_end]
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            month_expenses = transactions.filter(
                category='expense',
                status='paid',
                date__range=[month_start, month_end]
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            monthly_income.append({
                'month': month_date.strftime('%Y-%m'),
                'month_name': month_date.strftime('%B %Y'),
                'amount': float(month_income)
            })
            
            monthly_expenses.append({
                'month': month_date.strftime('%Y-%m'),
                'month_name': month_date.strftime('%B %Y'),
                'amount': float(month_expenses)
            })
        
        # Utilisation des budgets
        budget_utilization = []
        try:
            budgets = Budget.objects.filter(year=current_year, is_active=True)
            for budget in budgets:
                budget_utilization.append({
                    'department': budget.department,
                    'department_display': budget.get_department_display(),
                    'type': budget.budget_type,
                    'type_display': budget.get_budget_type_display(),
                    'allocated': float(budget.allocated_amount),
                    'spent': float(budget.spent_amount),
                    'committed': float(budget.committed_amount),
                    'remaining': float(budget.remaining_amount),
                    'utilization': budget.utilization_percentage,
                })
        except Exception as e:
            print(f"⚠️ Erreur budgets: {e}")
        
        data = {
            'total_income': float(total_income),
            'total_expenses': float(total_expenses),
            'total_salaries': float(total_salaries),
            'total_scholarships': float(total_scholarships),
            'net_balance': float(total_income - total_expenses - total_salaries - total_scholarships),
            'pending_transactions': pending_count,
            'overdue_transactions': overdue_count,
            'pending_amount': float(pending_amount),
            'overdue_amount': float(overdue_amount),
            'monthly_income': monthly_income,
            'monthly_expenses': monthly_expenses,
            'transaction_distribution': transaction_distribution,
            'budget_utilization': budget_utilization,
        }
        
        return Response({'success': True, 'data': data})
        
    except Exception as e:
        print(f"❌ Erreur calcul statistiques: {str(e)}")
        traceback.print_exc()
        return Response({
            'success': False,
            'error': 'Erreur lors du calcul des statistiques',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def export_transactions(request):
    """Exporter les transactions en CSV"""
    try:
        # Créer la réponse HTTP
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="transactions.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Numéro', 'Date', 'Type', 'Catégorie', 'Étudiant/Enseignant',
            'Montant total', 'Montant payé', 'Reste à payer',
            'Date échéance', 'Statut', 'Mode paiement', 'Description'
        ])
        
        transactions = Transaction.objects.all()
        
        for transaction in transactions:
            if transaction.student:
                try:
                    person = f"{transaction.student.user.first_name} {transaction.student.user.last_name}"
                except:
                    person = f"Étudiant {transaction.student_id}"
            elif transaction.teacher:
                try:
                    person = f"{transaction.teacher.user.first_name} {transaction.teacher.user.last_name}"
                except:
                    person = f"Enseignant {transaction.teacher_id}"
            else:
                person = ''
            
            writer.writerow([
                transaction.transaction_number or '',
                transaction.date.strftime('%d/%m/%Y') if transaction.date else '',
                transaction.get_transaction_type_display(),
                transaction.get_category_display() if transaction.category else '',
                person,
                str(transaction.amount) if transaction.amount else '0',
                str(transaction.paid_amount) if transaction.paid_amount else '0',
                str(transaction.remaining_amount),
                transaction.due_date.strftime('%d/%m/%Y') if transaction.due_date else '',
                transaction.get_status_display(),
                transaction.get_method_display() if transaction.method else '',
                transaction.description or ''
            ])
        
        return response
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)