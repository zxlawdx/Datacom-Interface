from django.db import models

# Create your models here.
class OLT(models.Model):
    name = models.CharField(max_length=50)
    host = models.CharField(max_length=100)
    port = models.IntegerField()