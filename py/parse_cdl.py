from HTMLParser import HTMLParser
from collections import deque
import hashlib
import json
import re

INPUT_FILE = '/Users/abrahamepton/Dropbox/Sites/testing/Flow/py/corefiles.html'
OUTPUT_FILE = '/Users/abrahamepton/Dropbox/Sites/testing/Flow/py/corefiles.json'

# Maximum number of text lines to keep when parsing
MAX_LINE_BUFFER = 5

class Card(object):
    def __init__(self):
        self.tag = ''
        self.cite = ''
        self.cite_extras = []
        self.text = ''
        self.highlights = []


class CardParser(HTMLParser):
    def __init__(self):
        HTMLParser.__init__(self)
        self.cards = []
        self.buffer = deque(maxlen=MAX_LINE_BUFFER)
        self.reset_cards()

    def read(self, data):
        # clear the current output before re-use
        self._lines = []
        # re-set the parser's state before re-use
        self.reset()
        self.feed(data)
        return ''.join(self._lines)

    def reset_cards(self):
        self.current_card = Card()
        self.current_data = ''
        self.current_type = None
        self.found_cite = False
        self.found_para = False
        self.opening_ul = 0

    def handle_starttag(self, tag, attrs):
        self.current_type = tag
        if tag == 'p':
            self.found_para = True
        elif tag == 'u':
            if self.current_data and self.found_cite and not self.current_card.text:
                self.opening_ul = len(self.current_data)

    def handle_endtag(self, tag):
        if tag == 'p':
            if self.found_para:
                if self.current_data:
                    self.buffer.append({
                        'type': self.current_type,
                        'data': ' '.join(self.current_data.splitlines())
                    })
                if self.current_data_is_cite():
                    self.current_card.cite = ' '.join(self.current_data.splitlines())
                    self.current_card.tag = re.sub(
                        r'(^[0-9a-zA-Z].*\))', '', self.buffer[3]['data'])
                    self.found_cite = True
                elif self.current_data_is_cite_extra() and self.found_cite:
                    self.current_card.cite_extras.append(' '.join(self.current_data.splitlines()))
                elif self.found_cite and not self.current_card.text and self.current_data:
                    self.current_card.text = ' '.join(self.current_data.splitlines())
                    sections = []
                    for i in self.current_card.highlights:
                        sections.append(self.current_card.text[i[0]:i[1]])
                    for s in sections:
                        self.current_card.text = self.current_card.text.replace(s, ' <u>%s</u>' % s)
                    self.cards.append(self.current_card)
                    self.reset_cards()
                self.found_para = False
                self.current_data = ''
        elif tag == 'html':
            self.save_cards()
        elif tag == 'u':
            if self.current_data and self.found_cite and not self.current_card.text:
                self.current_card.highlights.append([self.opening_ul, len(self.current_data)])
                self.opening_ul = 0

    def save_cards(self):
        cards = []
        for card in self.cards:
            m = hashlib.md5('%s-%s-%s-%s' % ('CDL', card.tag, card.cite, card.text))
            cards.append({
                'tag': card.tag,
                'cite': card.cite,
                'cite_extras': card.cite_extras,
                'text': card.text.decode('utf8', 'ignore'),
                'hash': m.hexdigest()
            })
        FH = open(OUTPUT_FILE, 'w+')
        FH.write(json.dumps(cards))
        FH.close()
        print 'Found %d cards' % len(cards)

    def current_data_is_cite(self):
        if self.current_data and self.current_data.isupper() and not self.found_cite:
            return True
        return False

    def current_data_is_cite_extra(self):
        if self.current_data.startswith('['):
            return True
        return False

    def handle_data(self, data):
        data = data.strip()
        if data:
            self.current_data = '%s%s' % (self.current_data, data)


def parse_file():
    """
    Open and parse a markdown-formatted file.
    """
    FH = open(INPUT_FILE)
    parser = CardParser()
    parser.read(FH.read())
    FH.close()

if __name__ == "__main__":
    parse_file()
