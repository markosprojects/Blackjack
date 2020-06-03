""" Blackjack game's various checks and rules
"""

VALUES = {'2': 2, '3': 3, '4': 4, '5': 5,
          '6': 6, '7': 7, '8': 8, '9': 9,
          '0': 10, 'A': 11, 'J': 10, 'Q': 10, 'K': 10}


def check_scores(hands):
    player_score = hands_value(hands['player1'])
    dealer_score = hands_value(hands['player2'])

    if player_score > 21:
        return 'You bust!'
    elif dealer_score > 21:
        return 'Dealer busts!<br/>You win!'
    elif player_score > dealer_score:
        return 'You win!'
    elif player_score < dealer_score:
        return 'Dealer wins!'
    else:
        return 'Both hands are equal!<br/>It\'s a push!'


def check_scores_split(hands):
    player_score_1 = hands_value(hands['player1'][0])
    player_score_2 = hands_value(hands['player1'][1])
    dealer_score = hands_value(hands['player2'])
    dealer_busts = ''
    blackjack = ''
    wins = 0
    ties = 0
    blackjacks = 0

    # Checking for wins
    if dealer_score > 21:
        dealer_busts = 'Dealer busts!<br/>'
        if player_score_1 <= 21:
            wins += 1
        if player_score_2 <= 21:
            wins += 1
    else:
        if player_score_1 <= 21 and player_score_1 > dealer_score:
            wins += 1
        if player_score_2 <= 21 and player_score_2 > dealer_score:
            wins += 1

    # Checking for ties
    if dealer_score == player_score_1:
        ties += 1
    if dealer_score == player_score_2:
        ties += 1

    # Checking for blackjacks
    if player_score_1 == 21 and len(hands['player1'][0]) == 2:
        blackjacks += 1
    if player_score_2 == 21 and len(hands['player1'][1]) == 2:
        blackjacks += 1

    if ties == 2:
        return 'Both hands are equal!<br/>It\'s a push!'
    elif wins == 0:
        return 'Dealer wins!'
    else:
        if blackjacks == 1:
            blackjack = '<br/> And you have a Blackjack!!!'
        elif blackjacks == 2:
            # Highly unlikely :)
            return 'You have 2 Blackjacks!!!<br/>You\'re paid 3 to 2!'
        return f'{dealer_busts}You win {wins} out of 2!{blackjack}'


def card_value(card):
    return VALUES[card[:1]]


def hands_value(hand):
    value = 0
    aces = 0
    for card in hand:
        value += VALUES[card[:1]]
        if card[:1] == 'A':
            aces += 1
    if value > 21 and aces:
        value -= 10
        aces -= 1
    return value


def dealer_hand_values_accumulated(list):
    new_list = []
    aces = 0
    sum = 0
    for item in list:
        if item == 11:
            aces += 1
        sum += item
        if sum > 21 and aces:
            sum -= 10
            aces -= 1
        new_list.append(sum)
    return new_list
