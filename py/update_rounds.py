from boto.s3.connection import S3Connection
from boto.s3.key import Key
import os
import json

ROUNDS_BUCKET = 'myflo.ws'
ROUNDS_PREFIX = 'rounds/'
ROUNDS_METADATA_NAME = 'metadata'

def get_connection():
    return S3Connection(
        os.environ.get('ABE_AWS_ACCESS_KEY_ID'), os.environ.get('ABE_AWS_SECRET_ACCESS_KEY'))

def add_jsonp(str):
    if str.startswith('f(') and str.endswith(');'):
        return str
    return 'f(%s);' % str

def strip_jsonp(str):
    if str.startswith('f(') and str.endswith(');'):
        return str[2:-2]
    return str

def get_rounds(conn):
    flows_bucket = conn.get_bucket(ROUNDS_BUCKET)
    keys = []
    for l in flows_bucket.list(prefix=ROUNDS_PREFIX):
        obj = flows_bucket.get_key(l.key)
        if len(l.key) > len(ROUNDS_PREFIX):
            keys.append(obj)
    return keys

def extract_metadata_from_rounds(keys):
    metadata = {}
    for k in keys:
        key = k.key[len(ROUNDS_PREFIX):]
        try:
            metadata[key] = {
                'data': json.loads(strip_jsonp(k.get_contents_as_string()))['round'],
                'last_modified': k.last_modified
            }
        except KeyError:
            continue
    return metadata

def save_metadata_to_s3(conn, metadata):
    flows_bucket = conn.get_bucket(ROUNDS_BUCKET)
    obj = Key(flows_bucket)
    obj.key = '%s%s' % (ROUNDS_PREFIX, ROUNDS_METADATA_NAME)
    obj.set_metadata('Content-Type', 'text/jsonp')
    obj.set_contents_from_string(add_jsonp(json.dumps(metadata)))
    obj.make_public()

if __name__ == '__main__':
    conn = get_connection()
    round_keys = get_rounds(conn)
    metadata = extract_metadata_from_rounds(round_keys)
    save_metadata_to_s3(conn, metadata)
