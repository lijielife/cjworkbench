"""
Django settings for cjworkbench project.

Generated by 'django-admin startproject' using Django 1.10.2.

For more information on this file, see
https://docs.djangoproject.com/en/1.10/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.10/ref/settings/
"""

import os
import sys
import json
from json.decoder import JSONDecodeError
from os.path import abspath, basename, dirname, join, normpath
from server.settingsutils import *

if sys.version_info[0] < 3:
    raise RuntimeError('CJ Workbench requires Python 3')

I_AM_TESTING = 'test' in sys.argv

# ----- Configurable Parameters -----

# How many rows in one table?
MAX_ROWS_PER_TABLE = 1000000

# How much StoredObject space can each module take up?
MAX_STORAGE_PER_MODULE = 1024*1024*1024

# configuration for urlscraper
SCRAPER_NUM_CONNECTIONS = 8
SCRAPER_TIMEOUT = 30 # seconds

# ----- App Boilerplate -----

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Configuration below uses these instead of BASE_DIR
DJANGO_ROOT = dirname(dirname(abspath(__file__)))
SITE_ROOT = dirname(DJANGO_ROOT)
SITE_NAME = basename(DJANGO_ROOT)
SITE_ID = 1

# /media is where uploaded files, fetched data, and cached tables are strored
MEDIA_ROOT = os.path.join(BASE_DIR, 'media/')
if not os.path.isdir(MEDIA_ROOT):
    os.makedirs(MEDIA_ROOT)

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.10/howto/deployment/checklist/

# SECURITY WARNING: don't run with debug turned on in production!
if 'CJW_PRODUCTION' in os.environ:
    DEBUG = not os.environ['CJW_PRODUCTION']
else:
    DEBUG=True

DEFAULT_FROM_EMAIL = 'Workbench <hello@accounts.workbenchdata.com>'

# Various environment variables must be set in production
if DEBUG==False:
    try:
        SECRET_KEY = os.environ['CJW_SECRET_KEY']
    except KeyError:
        sys.exit('Must set CJW_SECRET_KEY in production')

    if 'CJW_DB_HOST' not in os.environ:
        sys.exit('Must set CJW_DB_HOST in production')

    if 'CJW_DB_PASSWORD' not in os.environ:
        sys.exit('Must set CJW_DB_PASSWORD in production')

    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql_psycopg2',
            'NAME': 'cjworkbench',
            'USER': 'cjworkbench',
            'HOST': os.environ['CJW_DB_HOST'],
            'PASSWORD': os.environ['CJW_DB_PASSWORD'],
            'PORT': '5432',
        }
    }

    if 'CJW_SENDGRID_API_KEY' not in os.environ:
        sys.exit('Must set CJW_SENDGRID_API_KEY in production')

    if not all(x in os.environ for x in [
        'CJW_SENDGRID_INVITATION_ID',
        'CJW_SENDGRID_CONFIRMATION_ID',
        'CJW_SENDGRID_PASSWORD_CHANGE_ID',
        'CJW_SENDGRID_PASSWORD_RESET_ID'
        ]):
        sys.exit('Must set Sendgrid template IDs for all system emails')

    if os.environ.get('CJW_MOCK_EMAIL'): # e.g., integration tests
        EMAIL_BACKEND = 'django.core.mail.backends.filebased.EmailBackend'
        EMAIL_FILE_PATH = os.path.join(BASE_DIR, 'local_mail')
    else:
        EMAIL_BACKEND = 'sgbackend.SendGridBackend'

    SENDGRID_API_KEY = os.environ['CJW_SENDGRID_API_KEY']
    ACCOUNT_ADAPTER = 'cjworkbench.views.account_adapter.WorkbenchAccountAdapter'
    SENDGRID_TEMPLATE_IDS = {
        'account/email/email_confirmation': os.environ['CJW_SENDGRID_CONFIRMATION_ID'],
        'account/email/email_confirmation_signup': os.environ['CJW_SENDGRID_CONFIRMATION_ID'],
        'account/email/password_reset_key': os.environ['CJW_SENDGRID_PASSWORD_RESET_ID'],
    }
    SESSION_ENGINE='django.contrib.sessions.backends.db'

else:
    # We are running in debug
    SECRET_KEY = 'my debug secret key is not a secret'

    #print('Server running in debug.')

    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
            'OPTIONS': {
                'timeout': 30,
            },
        },
    }
    EMAIL_BACKEND = 'django.core.mail.backends.filebased.EmailBackend'
    EMAIL_FILE_PATH = os.path.join(BASE_DIR, 'local_mail')

if 'CJW_GOOGLE_ANALYTICS' in os.environ:
    GOOGLE_ANALYTICS_PROPERTY_ID = os.environ['CJW_GOOGLE_ANALYTICS']

if 'HTTPS' in os.environ and os.environ['HTTPS'] == 'on':
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    USE_X_FORWARDED_HOST = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

ALLOWED_HOSTS = ['*']

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    'cjworkbench',
    'server',
    'webpack_loader',
    'rest_framework',
    'channels',
    'polymorphic',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware'
]

ROOT_URLCONF = 'cjworkbench.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
#        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'DIRS': ['templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages'
            ],
        },
    },
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    )
}

WSGI_APPLICATION = 'cjworkbench.wsgi.application'
ASGI_APPLICATION = 'cjworkbench.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}




# Password validation
# https://docs.djangoproject.com/en/1.10/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LOGIN_URL = '/account/login'
LOGIN_REDIRECT_URL = '/workflows'

# Internationalization
# https://docs.djangoproject.com/en/1.10/topics/i18n/

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True


# Static files. CSS, JavaScript are bundled by webpack, but fonts, test data, images, etc. are not
STATIC_URL = '/static/'
STATIC_ROOT = normpath(join(DJANGO_ROOT, 'static'))
STATICFILES_DIRS = (
    os.path.join(BASE_DIR, 'assets'), # We do this so that django's collectstatic copies or our bundles to the STATIC_ROOT or syncs them to whatever storage we use.
)

# Webpack loads all our js/css into handy bundles
WEBPACK_LOADER = {
    'DEFAULT': {
        'BUNDLE_DIR_NAME': 'bundles/',
        'STATS_FILE': os.path.join(BASE_DIR, 'webpack-stats.json'),
    }
}

# Redirect logs to console on prod, so we can view them with docker logs
LOGGING = {
    'version': 1,
    'formatters': {
        'verbose': {
            'format': '%(levelname)s %(asctime)s %(module)s %(process)d %(thread)d %(message)s'
        },
        'simple': {
            'format': '%(levelname)s %(message)s'
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple'
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
    }
}

# User accounts

ACCOUNT_USER_MODEL_USERNAME_FIELD = 'username'
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_EMAIL_VERIFICATION = 'mandatory'
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_USER_DISPLAY = workbench_user_display
ACCOUNT_SIGNUP_FORM_CLASS = 'cjworkbench.forms.signup.WorkbenchSignupForm'

AUTHENTICATION_BACKENDS = [
    'allauth.account.auth_backends.AuthenticationBackend',
]

# Third party services

# Google, for Google Drive. Eventually hook into django-allauth's auth token and replace our own implementation.

CJW_GOOGLE_CLIENT_SECRETS_PATH = os.environ.get('CJW_GOOGLE_CLIENT_SECRETS', False)
if not CJW_GOOGLE_CLIENT_SECRETS_PATH:
    CJW_GOOGLE_CLIENT_SECRETS_PATH = 'client_secret.json'

CJW_GOOGLE_CLIENT_SECRETS_PATH = os.path.join(BASE_DIR, CJW_GOOGLE_CLIENT_SECRETS_PATH)

if os.path.isfile(CJW_GOOGLE_CLIENT_SECRETS_PATH):
    GOOGLE_OAUTH2_CLIENT_SECRETS_JSON = CJW_GOOGLE_CLIENT_SECRETS_PATH
else:
    # Test environment
    GOOGLE_OAUTH2_CLIENT_ID = ''
    GOOGLE_OAUTH2_CLIENT_SECRET = ''

# Various services for django-allauth

CJW_SOCIALACCOUNT_SECRETS_PATH = os.environ.get('CJW_SOCIALACCOUNT_SECRETS', False)
if not CJW_SOCIALACCOUNT_SECRETS_PATH:
    CJW_SOCIALACCOUNT_SECRETS_PATH = 'socialaccounts_secrets.json'

CJW_SOCIALACCOUNT_SECRETS_PATH = os.path.join(BASE_DIR, CJW_SOCIALACCOUNT_SECRETS_PATH)

if os.path.isfile(CJW_SOCIALACCOUNT_SECRETS_PATH):
    try:
        CJW_SOCIALACCOUNT_SECRETS = json.loads(open(CJW_SOCIALACCOUNT_SECRETS_PATH, 'r').read())
    except JSONDecodeError:
        CJW_SOCIALACCOUNT_SECRETS = []

    for provider in CJW_SOCIALACCOUNT_SECRETS:


        INSTALLED_APPS.append('allauth.socialaccount.providers.' + provider['provider'])

else:

    CJW_SOCIALACCOUNT_SECRETS = []


# Knowledge base root url, used as a default for missing help links
KB_ROOT_URL = 'http://help.workbenchdata.com/'

try:
    from cjworkbench.local_settings import *
except ImportError:
    pass

if I_AM_TESTING:
    for provider in ['allauth.socialaccount.providers.facebook',
                     'allauth.socialaccount.providers.google']:
        if provider not in INSTALLED_APPS:
            INSTALLED_APPS.append(provider)

TEST_RUNNER = 'server.tests.runner.TimeLoggingDiscoverRunner'
