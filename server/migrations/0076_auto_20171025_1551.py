# -*- coding: utf-8 -*-
# Generated by Django 1.11 on 2017-10-25 15:51
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('server', '0075_remove_storedobject_success'),
    ]

    operations = [
        migrations.AddField(
            model_name='storedobject',
            name='name',
            field=models.CharField(default=None, max_length=255, null=True, verbose_name='name'),
        ),
        migrations.AddField(
            model_name='storedobject',
            name='size',
            field=models.IntegerField(default=None, null=True, verbose_name='size'),
        ),
        migrations.AddField(
            model_name='storedobject',
            name='uuid',
            field=models.CharField(default=None, max_length=255, null=True, verbose_name='uuid'),
        ),
    ]
