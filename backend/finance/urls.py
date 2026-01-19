# backend/finance/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'transactions', views.TransactionViewSet, basename='transaction')
router.register(r'budgets', views.BudgetViewSet, basename='budget')

# Dans backend/finance/urls.py
urlpatterns = [
    path('', include(router.urls)),
    path('statistics/', views.finance_statistics, name='finance-statistics'),
    path('export/transactions/', views.export_transactions, name='export-transactions'),
    path('test/transactions/', views.test_transactions, name='test-transactions'),  # <-- AJOUTEZ CETTE LIGNE
]
# Les URLs générées seront :
# GET /api/finance/transactions/ - liste
# POST /api/finance/transactions/ - création
# GET /api/finance/transactions/{id}/ - détails
# PUT /api/finance/transactions/{id}/ - mise à jour complète
# PATCH /api/finance/transactions/{id}/ - mise à jour partielle
# DELETE /api/finance/transactions/{id}/ - suppression