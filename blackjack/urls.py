from django.urls import path
from . import views

urlpatterns = [
    path('', views.blackjack_page, name='blackjack'),
    path('rules/', views.blackjack_rules, name='blackjack-rules'),

    path('new-hand/<int:state>/<str:key>/', views.new_hand, name='new-hand'),
    path('split-hand/<str:key>/', views.split_hand, name='split-hand'),
    path('deck-detail/<str:key>/', views.deck_detail, name='deck-detail'),
    path('deck-delete/<str:key>/', views.deck_delete, name='deck-delete'),

    path('hit-card/<str:key>/', views.hit_card, name='hit-card'),
    path('hit-card-split/<int:hand>/<str:key>/',
         views.hit_card_split, name='hit-card-split'),
    path('stand-pat/<str:key>/', views.stand_pat, name='stand-pat'),
    path('stand-pat-split/<str:key>/',
         views.stand_pat_split, name='stand-pat-split'),
]
