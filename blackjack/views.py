from django.shortcuts import render
from django.http import JsonResponse
from api.models import Deck

from .rules import check_scores, check_scores_split, hands_value, card_value, dealer_hand_values_accumulated


def blackjack_page(request):
    return render(request, "blackjack/blackjack.html")


def blackjack_rules(request):
    return render(request, "blackjack/blackjack-rules.html")


def new_hand(request, state, key=0):
    """ Creates a new deck if state == 1,
        reshuffles the current deck if state == 2,
        returns 2 cards for each player """
    if state == 1:
        # Create a new deck
        deck = Deck()
        deck.create_deck('blackjack')
    else:
        deck = Deck.objects.get(key=key)
        if state == 2 or len(deck.stack) < 10:
            # Reshuffle current deck
            deck.reset_deck()
        else:
            deck.clear_all_hands()

    player_hand = deck.draw_card(1, 2)
    dealer_hand = deck.draw_card(2, 2)
    deck.save()

    response = {
        'remaining': len(deck.stack),
        'success': True,
        'blackjack': hands_value(player_hand) == 21,
        'dealer_blackjack': hands_value(dealer_hand) == 21,
        'split': player_hand[0][:1] == player_hand[1][:1],
        'insurance': hands_value([dealer_hand[0]]) == 11,
        'double_down': (
            hands_value(player_hand) == 9 or
            hands_value(player_hand) == 10 or
            hands_value(player_hand) == 11),
        'deck_id': deck.key,
        'player_card_1_value': hands_value([player_hand[0]]),
        'player_score': hands_value(player_hand),
        'dealer_score': hands_value([dealer_hand[0]]),
        'player_hand': player_hand,
        'dealer_hand': dealer_hand
    }
    return JsonResponse(response)


def hit_card(request, key=0):
    """ Returns a card to the player and checks his score """
    try:
        deck = Deck.objects.get(key=key)
        card = deck.draw_card()
        deck.save()
        response = {
            'player_score': hands_value(deck.hands['player1']),
            'dealer_score': hands_value([deck.hands['player2'][0]]),
            'success': True,
            'deck_id': deck.key,
            'drawn': card,
            'hands': deck.hands,
            'remaining': len(deck.stack)
        }
    except Deck.DoesNotExist:
        response = {
            'success': False,
            'error': 'deck doesn\'t exist'
        }
    return JsonResponse(response)


def hit_card_split(request, hand=0, key=0):
    """ Returns a card to the player on the split hand and checks his score """
    try:
        deck = Deck.objects.get(key=key)
        card = deck.draw_card_split(hand)
        deck.save()
        response = {
            'player_score': hands_value(deck.hands['player1'][0]),
            'player_score_2': hands_value(deck.hands['player1'][1]),
            'dealer_score': hands_value([deck.hands['player2'][0]]),
            'success': True,
            'deck_id': deck.key,
            'drawn': card,
            'hands': deck.hands,
            'remaining': len(deck.stack)
        }
    except Deck.DoesNotExist:
        response = {
            'success': False,
            'error': 'deck doesn\'t exist'
        }
    return JsonResponse(response)


def stand_pat(request, key=0):
    """ Returns dealer's cards and the final score """
    try:
        deck = Deck.objects.get(key=key)
        while hands_value(deck.hands['player2']) < 17:
            deck.draw_card(2)
        result = check_scores(deck.hands)
        dealer_hand_values = [card_value(card)
                              for card in deck.hands['player2']]
        dealer_score = dealer_hand_values_accumulated(dealer_hand_values)

        deck.save()
        response = {
            'result': result,
            'player_score': hands_value(deck.hands['player1']),
            'dealer_values': [card_value(card) for card in deck.hands['player2']],
            'dealer_score': dealer_score,
            'success': True,
            'deck_id': deck.key,
            'dealer_hand': deck.hands['player2'],
            'remaining': len(deck.stack)
        }
    except Deck.DoesNotExist:
        response = {
            'success': False,
            'error': 'deck doesn\'t exist'
        }
    return JsonResponse(response)


def stand_pat_split(request, key=0):
    """ Returns dealer's cards for the split hand the final score """
    try:
        deck = Deck.objects.get(key=key)
        while hands_value(deck.hands['player2']) < 17:
            deck.draw_card(2)
        result = check_scores_split(deck.hands)
        dealer_hand_values = [card_value(card)
                              for card in deck.hands['player2']]
        dealer_score = dealer_hand_values_accumulated(dealer_hand_values)

        deck.save()
        response = {
            'result': result,
            'player_score': hands_value(deck.hands['player1'][0]),
            'player_score_2': hands_value(deck.hands['player1'][1]),
            'dealer_values': [card_value(card) for card in deck.hands['player2']],
            'dealer_score': dealer_score,
            'success': True,
            'deck_id': deck.key,
            'dealer_hand': deck.hands['player2'],
            'remaining': len(deck.stack)
        }
    except Deck.DoesNotExist:
        response = {
            'success': False,
            'error': 'deck doesn\'t exist'
        }
    return JsonResponse(response)


def split_hand(request, key=0):
    """ Splits player's hand into 2 """
    deck = Deck.objects.get(key=key)
    deck.split_hand('1')
    deck.save()

    response = {
        'remaining': len(deck.stack),
        'success': True,
        'deck_id': deck.key,
        'player_score': hands_value(deck.hands['player1'][0]),
        'player_score_2': hands_value(deck.hands['player1'][1]),
        'dealer_score': hands_value([deck.hands['player2'][0]])
    }
    return JsonResponse(response)


def deck_detail(request, key=0):
    try:
        deck = Deck.objects.get(key=key)
        response = {
            'success': True,
            'deck_id': deck.key,
            'remaining': len(deck.stack),
            'deck': deck.stack
        }
    except Deck.DoesNotExist:
        response = {
            'success': False,
            'error': 'deck doesn\'t exist'
        }
    return JsonResponse(response)


def deck_delete(request, key=0):
    try:
        deck = Deck.objects.get(key=key)
        deck.delete()
        response = 'Item successfully deleted!'
    except Deck.DoesNotExist:
        response = {
            'success': False,
            'error': 'deck doesn\'t exist'
        }
    return JsonResponse(response, safe=False)
