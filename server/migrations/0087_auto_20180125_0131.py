# -*- coding: utf-8 -*-
# Generated by Django 1.11 on 2018-01-25 01:31
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('server', '0086_parameterspec_placeholder'),
    ]

    operations = [
        migrations.AlterField(
            model_name='storedobject',
            name='size',
            field=models.IntegerField(default=0),
        ),
    ]