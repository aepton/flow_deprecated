from boto.s3.connection import S3Connection
import os

conn = S3Connection(
    os.environ.get('ABE_AWS_ACCESS_KEY_ID'), os.environ.get('ABE_AWS_SECRET_ACCESS_KEY'))

print conn

mybucket = conn.get_bucket('myflo.ws')
print mybucket.list()
