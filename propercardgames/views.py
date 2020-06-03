from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.contrib.auth.models import User
from django.db import IntegrityError
from django.shortcuts import render, redirect


def home_page(request):
    return render(request, 'home.html')


def login_user(request):
    if request.method == 'GET':
        context = {'form': AuthenticationForm()}
        return render(request, "login-user.html", context)
    else:
        user = authenticate(request, username=request.POST['username'],
                            password=request.POST['password'])
        if user is None:
            context = {'form': AuthenticationForm(
            ), 'error': 'Username or password did not match.'}
            return render(request, "login-user.html", context)
        else:
            login(request, user)
            return redirect('home-page')    # TODO CHANGE LANGING PAGE


@login_required
def logout_user(request):
    if request.method == 'POST':    # prevent Chrome from logging you out
        logout(request)
        return redirect('home-page')


def signup_user(request):
    if request.method == 'GET':
        context = {'form': UserCreationForm()}
        return render(request, "signup-user.html", context)
    else:
        # Create a new user
        if request.POST['password1'] == request.POST['password2']:
            try:
                user = User.objects.create_user(
                    request.POST['username'], password=request.POST['password1'])
                user.save()
                login(request, user)
                return redirect('home-page')
            except IntegrityError:
                context = {'form': UserCreationForm(), 'error': 'That username has already been taken. \
                                Please choose a new username.'}
                return render(request, 'signup-user.html', context)
        else:
            # Tell user that passwords didn't match
            context = {'form': UserCreationForm(),
                       'error': 'Passwords did not match. Try again.'}
            return render(request, 'signup-user.html', context)
