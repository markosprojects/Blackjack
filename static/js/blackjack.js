/***********************************************
 ** BLACKJACK GAME CONTROLLER
 */

// GLOBAL VARIABLES
const BASE_URL = 'http://127.0.0.1:8000/blackjack';
// let deck_id = 0;
let deck_id = 'hpijxkojzp';
let total_bank = 1000;
let current_bet = 0;
let hands_count = 0;

let gameSettingsSelected = false;

let hands_won = 0;
let highest_bet = 0;
let highest_bank = 1000;

let current_fetch = null;
let card_split = false;
let hand1_stand = false;
let hand1_bust = false;


// Game Button Listeners
document.querySelector('.hit-card').addEventListener('click', e => {
    hideElement('.buy-insurance');
    hideElement('.split-cards');
    hideElement('.double-down');

    hideElement('.result');
    card_split ? hitCardSplit() : hitCard();
});

document.querySelector('.stand-pat').addEventListener('click', e => {
    hideElement('.buy-insurance');
    hideElement('.split-cards');
    hideElement('.double-down');

    hideElement('.result');

    if (!card_split) {
        standPat();
    } else if (hand1_stand) {
        standPatSplit();
    } else {
        hand1_stand = true;
        displayElement('.result');
        clearElement('.result', 'Continue with the second hand');

        setTimeout(function () {
            hideElement('.result');
        }, 2000);
    }
});

document.querySelector('.new-hand').addEventListener('click', e => {
    if (current_bet > 0) {
        newHand();
    }
});

document.querySelector('.buy-insurance').addEventListener('click', e => {
    if (current_fetch.dealer_blackjack) {
        // -0.5x + 1x = 0.5x net
        total_bank += parseInt(Math.round(0.5 * current_bet));

        setTimeout(function () {
            flipHiddenCard(current_fetch.dealer_hand[1]);
            clearElement('.score-board__bank', formatNumber(total_bank));

            // update player
            setTimeout(function () {
                displayElement('.result');
                clearElement(
                    '.result',
                    "Dealer has a Blackjack!<br/>You're paid 2 to 1 for your insurance bet!"
                );
                current_bet = 0;

                setTimeout(function () {
                    hideElement('.result');
                    displayPlaceBetElements();
                }, 1500);
            }, 500);
        }, 500);

    } else {
        total_bank -= parseInt(Math.round(0.5 * current_bet));
        clearElement('.score-board__bank', formatNumber(total_bank));
        // update player
        displayElement('.result');
        clearElement(
            '.result',
            "Dealer doesn't have a Blackjack!<br/>You lose your insurance bet!"
        );

        setTimeout(function () {
            hideElement('.result');
        }, 1500);
    }

    hideElement('.buy-insurance');
});

document.querySelector('.split-cards').addEventListener('click', e => {
    card_split = true;

    hideElement('.double-down');
    hideElement('.split-cards');
    hideElement('.buy-insurance');

    displayElement('.player-score-2');

    splitCards();
});

document.querySelector('.double-down').addEventListener('click', e => {
    total_bank -= current_bet;
    current_bet *= 2;
    hideElement('.double-down');
    hideElement('.split-cards');
    hideElement('.buy-insurance');

    hitCard();
    standPat();
});

document.querySelector('.chips-box').addEventListener('click', e => {
    try {
        const value = e.target.closest('.chips-box__chip-item').dataset.value;
        if (value === 'clear') {
            total_bank += current_bet;
            current_bet = 0;
            updateScoreBoard();
            renderChips();
            clearElement('.result', 'Place your bet');
        } else if (value === 'all') {
            addChipsValue(total_bank);
            renderChips();
        } else {
            addChipsValue(value);
        }
    } catch (error) {}
});

// Final stats board button listeners
document.querySelector('.result').addEventListener('click', e => {
    try {
        const value = e.target.closest('.result__button-box--button').dataset.value;
        if (value === 'yes') {
            // Initialises a new game;
            total_bank = 1000;
            init();
        } else {
            // delete the deck ???
            // redirect to home page
            window.location.href = '/';
        }
    } catch (error) {}
});

// 'Cash Out' button listener
document.querySelector('.score-board').addEventListener('click', e => {
    try {
        hideElement('.card-deck');

        hideElement('.hit-card');
        hideElement('.stand-pat');
        hideElement('.dealer-score__tag');
        hideElement('.dealer-score');
        hideElement('.player-score__tag');
        hideElement('.player-score');
        hideElement('.player-score-2');
        hideElement('.buy-insurance');
        hideElement('.split-cards');
        hideElement('.double-down');

        clearElement('.player-cards-1');
        clearElement('.player-cards-2');
        clearElement('.dealer-cards');

        setTimeout(function () {
            renderStats((win = true));
        }, 500);
    } catch (error) {}
});

/***********************************************
 ** FUNCTIONS
 */

function gameSettings() {
    clearElement('.result', 'Game settings');
    gameSettingsSelected = true;
}

// Initialises the neccessary fields when the page is loaded
function init() {
    // Render card_deck
    clearElement('.blackjack-table__top-section--right');
    const markup = `
    <img class="card-deck" src="/static/img/cards/deck-blue.png" alt="card deck" />
    `;
    renderElement('.blackjack-table__top-section--right', markup);

    hideElement('.result');
    hideElement('.chips-box__display');
    hideElement('.new-hand');

    // Initialise stats
    hands_won = 0;
    highest_bet = 0;
    highest_bank = 1000;

    // Reinitiate the values
    card_split = false;
    hand1_stand = false;
    hand1_bust = false;

    // Render chips
    displayPlaceBetElements();

    // Render scorebard
    clearElement('.score-board__bank', formatNumber(total_bank));
    clearElement('.score-board__bet', formatNumber(current_bet));
}
init();


// Displays elements for the betting phase
function displayPlaceBetElements() {
    hideElement('.cashout-btn');

    hideElement('.hit-card');
    hideElement('.stand-pat');
    hideElement('.dealer-score__tag');
    hideElement('.dealer-score');
    hideElement('.player-score__tag');
    hideElement('.player-score');
    hideElement('.player-score-2');
    hideElement('.buy-insurance');
    hideElement('.split-cards');
    hideElement('.double-down');

    clearElement('.player-cards-1');
    clearElement('.player-cards-2');
    clearElement('.dealer-cards');

    // If player has money left in the bank shows the chips table
    // If not - shows the end game stats
    // if (total_bank > 960) {
    if (total_bank > 0) {
        setTimeout(function () {
            displayElement('.new-hand');

            displayElement('.chips-box__display');
            renderChips();
        }, 500);

        setTimeout(function () {
            if (total_bank < 50) {
                current_bet = total_bank;
                total_bank = 0;
            } else {
                current_bet = 50;
                total_bank -= 50;
            }
            clearElement('.score-board__bank', formatNumber(total_bank));
            clearElement('.score-board__bet', formatNumber(current_bet));

            displayElement('.result');
            clearElement('.result', `Place your bet: $${current_bet}`);

            // As $50 taken away, the 'Clear Bet' button will be rendered
            renderChips();
        }, 1000);
    } else {
        hideElement('.card-deck');
        setTimeout(function () {
            renderStats((win = false));
        }, 500);
    }
}


function hideElement(name) {
    document.querySelector(name).style.display = 'none';
}

function displayElement(name) {
    document.querySelector(name).style.display = 'inline-block';
}

// Changes element's HTML value, clears it by default
function clearElement(name, value = '') {
    document.querySelector(name).innerHTML = value;
}

function renderElement(name, markup) {
    document.querySelector(name).insertAdjacentHTML('beforeend', markup);
}

//
// =======================================================
//

// Deals a new hand
function newHand() {
    // Hide unnecessary elements
    hideElement('.new-hand');
    hideElement('.chips-box__display');
    hideElement('.result');
    hideElement('.buy-insurance');
    hideElement('.split-cards');
    hideElement('.double-down');

    let reshufflingTime = 0;

    let state = 0;
    hands_count++;

    // Checks if we need to shuffle a deck
    if (deck_id === 0) {
        state = 1;
    } else if (hands_count > 4) {
        state = 2;
        hands_count = 0;

        reshufflingTime = 4000;

        // Showing that cards are being reshuffled
        setTimeout(function () {
            displayElement('.result');
            clearElement('.result', 'Reshuffling cards');
            hideElement('.card-deck');

            setTimeout(function () {
                hideElement('.result');
                displayElement('.card-deck');
            }, 3000);
        }, 500);
    }

    setTimeout(function () {
        fetch(`${BASE_URL}/new-hand/${state}/${deck_id}`)
            .then(response => {
                if (response.status !== 200) {
                    console.log('Looks like there was a problem. Status Code: ' + response.status);
                    return;
                }

                response.json().then(data => {
                    current_fetch = data;
                    [deck_id, dealer_hand] = [data.deck_id, data.dealer_hand];

                    // Render 2 cards to each player and update score values
                    setTimeout(function () {
                        renderCard(
                            data.player_hand[0],
                            '.player-cards-1',
                            (skew = 1),
                            (first = true)
                        );

                        displayElement('.player-score__tag');
                        displayElement('.player-score');
                        clearElement('.player-score', data.player_card_1_value);
                    }, 500);

                    setTimeout(function () {
                        renderCard(data.player_hand[1], '.player-cards-1', (skew = 2));
                        clearElement('.player-score', data.player_score);
                    }, 1000);

                    setTimeout(function () {
                        renderCard(dealer_hand[0], '.dealer-cards', (skew = 1), (first = true));

                        displayElement('.dealer-score__tag');
                        displayElement('.dealer-score');
                        clearElement('.dealer-score', data.dealer_score);
                    }, 1500);

                    setTimeout(function () {
                        // Render hidden card
                        renderCard('back-blue', '.dealer-cards', (skew = 2));
                    }, 2000);

                    // Checks for the blackjack
                    if (data.blackjack) {
                        setTimeout(function () {
                            if (data.dealer_blackjack) {
                                flipHiddenCard(current_fetch.dealer_hand[1]);
                                clearElement('.dealer-score', 21);

                                setTimeout(function () {
                                    displayElement('.result');
                                    clearElement(
                                        '.result',
                                        "You both have a Blackjack!<br/>It's a push!"
                                    );

                                    updateScoreBoard(
                                        (playerWins = false),
                                        (blackjack = false),
                                        (push = true)
                                    );

                                    setTimeout(function () {
                                        hideElement('.result');
                                        displayPlaceBetElements();
                                        return;
                                    }, 2000);
                                }, 1000);
                            } else {
                                displayElement('.result');
                                clearElement(
                                    '.result',
                                    "You have a Blackjack!!!<br/>You're paid 3 to 2!"
                                );
                                updateScoreBoard((playerWins = true), (blackjack = true));
                            }

                            setTimeout(function () {
                                hideElement('.result');
                                displayPlaceBetElements();
                                return;
                            }, 2000);
                        }, 3000);
                    } else {
                        setTimeout(function () {
                            displayElement('.hit-card');
                            displayElement('.stand-pat');
                        }, 2500);

                        if (data.split && total_bank >= current_bet) {
                            setTimeout(function () {
                                displayElement('.split-cards');
                            }, 2500);
                        }
                        if (data.insurance && total_bank >= 0.5 * current_bet) {
                            setTimeout(function () {
                                displayElement('.buy-insurance');
                            }, 2500);
                        }
                        if (data.double_down && total_bank >= current_bet) {
                            setTimeout(function () {
                                displayElement('.double-down');
                            }, 2500);
                        }
                    }
                });
            })
            .catch(error => {
                console.log('Fetch Error :-S', error);
            });
    }, reshufflingTime);
}

// Hits a new card for the player
function hitCard() {
    fetch(`${BASE_URL}/hit-card/${deck_id}`)
        .then(response => {
            if (response.status !== 200) {
                console.log('Looks like there was a problem. Status Code: ' + response.status);
                return;
            }

            response.json().then(data => {
                setTimeout(function () {
                    renderCard(data.drawn, '.player-cards-1');
                    clearElement('.player-score', data.player_score);
                }, 100);

                if (data.player_score > 21) {
                    hideElement('.hit-card');
                    hideElement('.stand-pat');

                    setTimeout(function () {
                        displayElement('.result');
                        clearElement('.result', 'You bust!');

                        setTimeout(function () {
                            hideElement('.result');
                            displayPlaceBetElements();
                        }, 1000);
                    }, 600);
                }

            });
        })
        .catch(error => {
            console.log('Fetch Error :-S', error);
        });
}

// Deals the rest of the cards for the dealer
function standPat() {
    fetch(`${BASE_URL}/stand-pat/${deck_id}`)
        .then(response => {
            if (response.status !== 200) {
                console.log('Looks like there was a problem. Status Code: ' + response.status);
                return;
            }

            response.json().then(data => {
                setTimeout(function () {
                    // Unveil deale's hidden card
                    flipHiddenCard(data.dealer_hand[1]);
                    clearElement('.dealer-score', data.dealer_score[1]);

                    setTimeout(function () {
                        data.dealer_hand.forEach((el, i) => {
                            setTimeout(function () {
                                if (i > 1) {
                                    setTimeout(function () {
                                        renderCard(el, '.dealer-cards');
                                        clearElement('.dealer-score', data.dealer_score[i]);
                                    }, 500 * (i - 1));
                                }
                            }, 500);
                        });

                        setTimeout(function () {
                            // clearElement('.dealer-score', data.dealer_score);

                            displayElement('.result');
                            clearElement('.result', data.result);
                            const playerWins = data.result.includes('You win');
                            const isPush = data.result.includes("It's a push");
                            updateScoreBoard(playerWins, (blackjack = false), isPush);

                            setTimeout(function () {
                                hideElement('.result');
                                displayPlaceBetElements();
                            }, 500 * (data.dealer_hand.length + 1) - 250);
                        }, 500 * data.dealer_hand.length);
                    }, 0);
                }, 500);
            });
        })
        .catch(error => {
            console.log('Fetch Error :-S', error);
        });
}

// Splits player's cards into two hands
function splitCards() {
    // need to take double bet
    total_bank -= current_bet;
    current_bet *= 2;

    clearElement('.score-board__bank', formatNumber(total_bank));
    clearElement('.score-board__bet', formatNumber(current_bet));

    clearElement('.player-cards-1');
    renderCard(
        current_fetch.player_hand[0],
        '.player-cards-1',
        (skew = 2),
        (first = true),
        (firstSplit = true)
    );
    renderCard(current_fetch.player_hand[1], '.player-cards-2', (skew = 2), (first = true));

    fetch(`${BASE_URL}/split-hand/${deck_id}`)
        .then(response => {
            if (response.status !== 200) {
                console.log('Looks like there was a problem. Status Code: ' + response.status);
                return;
            }

            response.json().then(data => {
                clearElement('.player-score', data.player_score);
                clearElement('.player-score-2', data.player_score_2);
            });
        })
        .catch(error => {
            console.log('Fetch Error :-S', error);
        });
}

// Deals card for player's second hand
function hitCardSplit() {
    // Checks which hand to draw a card to: hand1 = 0, hand2 = 1
    const hand = hand1_stand ? 1 : 0;

    fetch(`${BASE_URL}/hit-card-split/${hand}/${deck_id}`)
        .then(response => {
            if (response.status !== 200) {
                console.log('Looks like there was a problem. Status Code: ' + response.status);
                return;
            }

            response.json().then(data => {
                if (hand1_stand) {
                    // Render 2nd hand cards
                    setTimeout(function () {
                        renderCard(data.drawn, '.player-cards-2');
                        clearElement('.player-score-2', data.player_score_2);
                    }, 100);

                    if (data.player_score_2 > 21) {
                        if (hand1_bust) {
                            setTimeout(function () {
                                displayElement('.result');
                                clearElement('.result', 'You bust again!');

                                setTimeout(function () {
                                    hideElement('.result');
                                    displayPlaceBetElements();
                                }, 1000);
                            }, 600);
                        } else {
                            setTimeout(function () {
                                standPatSplit();
                            }, 500);
                        }
                    }
                } else {
                    // Render 1st hand cards
                    setTimeout(function () {
                        renderCard(data.drawn, '.player-cards-1');
                        clearElement('.player-score', data.player_score);
                    }, 100);

                    if (data.player_score > 21) {
                        // if 1st hand busts
                        setTimeout(function () {
                            displayElement('.result');
                            hand1_stand = true;
                            hand1_bust = true;
                            clearElement('.result', 'You bust!<br/>Continue with the second hand');

                            setTimeout(function () {
                                hideElement('.result');
                            }, 1000);
                        }, 100);
                    }
                }
            });
        })
        .catch(error => {
            console.log('Fetch Error :-S', error);
        });
}

// Deals the remaining dealer's cards when player has split his hand
function standPatSplit() {
    // When the player chooses to stand on his second hand

    fetch(`${BASE_URL}/stand-pat-split/${deck_id}`)
        .then(response => {
            if (response.status !== 200) {
                console.log('Looks like there was a problem. Status Code: ' + response.status);
                return;
            }

            response.json().then(data => {
                setTimeout(function () {
                    // Unveil deale's hidden card
                    flipHiddenCard(data.dealer_hand[1]);
                    clearElement('.dealer-score', data.dealer_score[1]);

                    setTimeout(function () {
                        data.dealer_hand.forEach((el, i) => {
                            setTimeout(function () {
                                if (i > 1) {
                                    setTimeout(function () {
                                        renderCard(el, '.dealer-cards');
                                        clearElement('.dealer-score', data.dealer_score[i]);
                                    }, 500 * (i - 1));
                                }
                            }, 500);
                        });

                        setTimeout(function () {
                            // clearElement('.dealer-score', data.dealer_score);

                            displayElement('.result');
                            clearElement('.result', data.result);
                            /**
                             * ADD MORE CHECKS HERE
                             */

                            if (data.result.includes('You win 1 out of 2')) {
                                // Current bet is halved as player loses 1 hand
                                current_bet /= 2;
                                if (data.result.includes('you have a Blackjack')) {
                                    updateScoreBoard((playerWins = true), (blackjack = true));
                                }
                                updateScoreBoard((playerWins = true));
                            }
                            if (data.result.includes('You win 2 out of 2')) {
                                if (data.result.includes('you have a Blackjack')) {
                                    // Adding bonus for the blackjack (extra 50% of the half bet)
                                    total_bank += parseInt(Math.round(current_bet * 0.5 * 0.5));
                                }
                                // Adding and extra win as we call updateScoreBoard only once
                                hands_won++;
                                updateScoreBoard((playerWins = true));
                            }
                            if (data.result.includes('You have 2 Blackjacks')) {
                                updateScoreBoard((playerWins = true), (blackjack = true));
                            }

                            // updateScoreBoard(playerWins, (blackjack = false), isPush);
                            setTimeout(function () {
                                hideElement('.result');
                                displayPlaceBetElements();
                            }, 500 * (data.dealer_hand.length + 1) - 250);
                        }, 500 * data.dealer_hand.length);
                    }, 0);
                }, 500);
            });
        })
        .catch(error => {
            console.log('Fetch Error :-S', error);
        });
}

//
// ========= RENDER ELEMENTS ===========================================
//

function renderCard(card, field, skew = 3, first = false, firstSplit = false) {
    const onTop = first ? '' : 'card-on-top';
    const markup = `
        <img class="card-image ${onTop} card-skewed-${skew} ${
        card.includes('back') ? 'hidden-card' : ''
    }" src="/static/img/cards/${card}.png" alt="card ${card}" ${
        firstSplit ? "style='margin-left: -4rem'" : ''
    } />
    `;

    document.querySelector(field).insertAdjacentHTML('beforeend', markup);
}

function flipHiddenCard(card) {
    document.querySelector('.hidden-card').style.display = 'none';
    renderCard(card, '.dealer-cards', (skew = 2));
}

function renderChips() {
    clearElement('.chips-box__display');

    const chips = [1, 5, 25, 50, 100, 500, 1000, 5000, 10000];

    // if bank is greater than 10,000 it won't render $1 chip
    if (total_bank > 10000) {
        chips.shift();
    }

    for (let i in chips) {
        renderChip(chips[i]);
    }

    // Create a div element for buttons
    renderElement('.chips-box__display', '<div class="chips-box__button-box"></div>');

    if (current_bet > 0) {
        renderClearBtn();
    }

    if (total_bank > 0) {
        renderAllInBtn();
    }

    function renderChip(chip) {
        if (chip <= total_bank) {
            const markup = `
                    <img src="/static/img/chips/${chip}.png" alt="chip-${chip}" class="chips-box__chip-item" data-value="${chip}" />
                `;
            renderElement('.chips-box__display', markup);
        }
    }

    function renderClearBtn() {
        const markup = `
                <button class="btn chips-box__chip-item chips-box__clear-bet" data-value="clear">Clear bet</button>
            `;
        renderElement('.chips-box__button-box', markup);
    }

    function renderAllInBtn() {
        const markup = `
                <button class="btn chips-box__chip-item chips-box__all-in" data-value="all">All in</button>
            `;
        renderElement('.chips-box__button-box', markup);
    }
}

// Renders final stats board
function renderStats(win = false) {
    const title = win ? 'YOU WIN!' : 'GAME OVER!';
    const cashWon = total_bank > 1000 ? total_bank - 1000 : 0;

    displayElement('.result');
    clearElement(
        '.result',
        `${title}<br/><br/>Total cash won: $${
            cashWon >= 1000 ? formatNumber(cashWon) : cashWon
        },<br/>Total hands won: ${hands_won},<br/>Highest bank: ${formatNumber(
            highest_bank
        )}<br/>Highest bet: ${formatNumber(highest_bet)}<br/><br/>Want to play again?<br/><br/>`
    );

    // Create a div element for buttons
    renderElement('.result', '<div class="result__button-box"></div>');

    renderYesBtn();
    renderNoBtn();

    function renderYesBtn() {
        const markup = `
                <button class="btn result__button-box--button" data-value="yes">Yes</button>
            `;
        renderElement('.result__button-box', markup);
    }

    function renderNoBtn() {
        const markup = `
                <button class="btn result__button-box--button" data-value="no">No</button>
            `;
        renderElement('.result__button-box', markup);
    }
}

function addChipsValue(value) {
    current_bet += parseInt(value);
    total_bank -= parseInt(value);

    renderChips();

    displayElement('.result');
    clearElement('.result', `Place your bet: ${formatNumber(current_bet)}`);
    clearElement('.score-board__bank', formatNumber(total_bank));
    clearElement('.score-board__bet', formatNumber(current_bet));
}

// Formats big numbers, inserts commas and adds currency sign
// E.g. 10000 -> $10,000
function formatNumber(num) {
    let number = num.toString();

    if (num >= 1000 && num < 100000) {
        number = number.substr(0, number.length - 3) + ',' + number.substr(number.length - 3, 3);
    } else if (num >= 100000) {
        number =
            number.substr(0, number.length - 6) +
            ',' +
            number.substr(number.length - 6, 3) +
            ',' +
            number.substr(number.length - 3, 3);
    }

    return '$' + number;
}

function updateScoreBoard(playerWins, blackjack = false, push = false) {
    highest_bet = current_bet > highest_bet ? current_bet : highest_bet;
    highest_bank = total_bank > highest_bank ? total_bank : highest_bank;

    if (push) {
        total_bank += current_bet;
        current_bet = 0;
    }

    if (playerWins) {
        hands_won++;

        // Adjusts the winnings in case of blackjack
        if (blackjack) {
            total_bank += current_bet + parseInt(Math.round(current_bet * 1.5));
        } else {
            total_bank += current_bet * 2;
        }
    }

    current_bet = 0;
    clearElement('.score-board__bank', formatNumber(total_bank));
    clearElement('.score-board__bet', '$0');
}