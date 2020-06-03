from django.db import models
from jsonfield import JSONField

import random
import string
import datetime


CARDS = ['2S', '3S', '4S', '5S', '6S', '7S', '8S', '9S', '0S',
         '2D', '3D', '4D', '5D', '6D', '7D', '8D', '9D', '0D',
         '2C', '3C', '4C', '5C', '6C', '7C', '8C', '9C', '0C',
         '2H', '3H', '4H', '5H', '6H', '7H', '8H', '9H', '0H',
         'AS', 'AD', 'AC', 'AH', 'JS', 'JD', 'JC', 'JH',
         'QS', 'QD', 'QC', 'QH', 'KS', 'KD', 'KC', 'KH']

SUITS = {'S': 'SPADES', 'D': 'DIAMONDS', 'H': 'HEARTS', 'C': 'CLUBS'}

VALUES = {'A': 'ACE', 'J': 'JACK', 'Q': 'QUEEN', 'K': 'KING', '0': '10'}


def random_string():
    return ''.join(random.choice(string.ascii_lowercase + string.digits) for i in range(10))


class Deck(models.Model):
    key = models.CharField(default=random_string, max_length=12, db_index=True)
    last_used = models.DateTimeField(default=datetime.datetime.now)
    game = models.CharField(max_length=15, null=True, blank=True)
    players = models.PositiveSmallIntegerField(default=2)
    stack = JSONField(null=True, blank=True)
    drawn = JSONField(null=True, blank=True)
    hands = JSONField(null=True, blank=True)

    def __str__(self):
        return f'Deck - id: {self.key}, game: {self.game}, drawn: {52 - len(self.stack)}, remaining: {len(self.stack)}'

    def save(self, *args, **kwargs):
        self.last_used = datetime.datetime.now()
        super(Deck, self).save(*args, **kwargs)

    def create_deck(self, game, players=2):
        self.game = game
        self.players = players
        self.hands = {}
        self.clear_all_hands()  # Initialise hands
        stack = []
        stack = CARDS
        random.shuffle(stack)
        self.stack = stack

    def draw_card(self, player=1, num_cards=1):
        cards = []
        if self.drawn is None:
            self.drawn = []

        for i in range(num_cards):
            card = self.stack.pop()
            cards.append(card)
            self.drawn.append(card)
            self.hands[f'player{player}'].append(card)
        return cards

    # Blackjack specific
    def draw_card_split(self, hand=0):
        card = self.stack.pop()
        self.drawn.append(card)
        self.hands['player1'][hand].append(card)
        return card

    def reset_deck(self):
        self.stack += self.drawn
        random.shuffle(self.stack)
        self.drawn.clear()
        self.clear_all_hands()

    def clear_all_hands(self):
        index = 1
        for i in range(self.players):
            self.hands[f'player{index}'] = []
            index += 1

    # Blackjack specific
    def split_hand(self, player_index):
        hand = self.hands[f'player{player_index}']
        self.hands[f'player{player_index}'] = []
        self.hands[f'player{player_index}'].append(list())
        self.hands[f'player{player_index}'][0].append(hand[0])
        self.hands[f'player{player_index}'].append(list())
        self.hands[f'player{player_index}'][1].append(hand[1])
