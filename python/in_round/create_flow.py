#!/usr/bin/env python
# encoding: utf-8
"""
create_flow.py

Handles in-round flow creation.

Created by Abe Epton on 2012-09-05.
"""

import logging
import os
import random
import json
import sys
import webapp2
import wsgiref.handlers

from google.appengine.ext import db
from google.appengine.ext import webapp
from google.appengine.ext.webapp import template

APP_PREFIX = '/flow/'
HTML_PREFIX = '../../html/in_round/'

# Backend representation of a single card
class CardModel(db.Model):
  text = db.TextProperty()
  cite = db.StringProperty()
  speech = db.StringProperty()
  cardNum = db.IntegerProperty()
  topicId = db.IntegerProperty()
  roundId = db.IntegerProperty()

# Backend representation of a round topic
class TopicModel(db.Model):
  topicName = db.StringProperty()
  topicId = db.IntegerProperty()
  roundId = db.IntegerProperty()

# Backend representation of a round
class RoundModel(db.Model):
  affSchool = db.StringProperty()
  negSchool = db.StringProperty()
  affTeam = db.StringProperty()
  negTeam = db.StringProperty()
  affFirstSpeaker = db.StringProperty()
  negFirstSpeaker = db.StringProperty()
  affSecondSpeaker = db.StringProperty()
  negSecondSpeaker = db.StringProperty()
  winner = db.StringProperty()  # aff or neg

# App landing page
class Front(webapp2.RequestHandler):
  def get(self):
    template_values = {'flows': []}
    rounds = RoundModel.all()
    for rnd in rounds:
      template_values['flows'].append({
        'affSchool': rnd.affSchool,
        'negSchool': rnd.negSchool,
        'affTeam': rnd.affTeam,
        'negTeam': rnd.negTeam,
        '1a': rnd.affFirstSpeaker,
        '2a': rnd.affSecondSpeaker,
        '1n': rnd.negFirstSpeaker,
        '2n': rnd.negSecondSpeaker,
        'roundId': rnd.key().id()
      })
    logging.info('Template values: %s' % template_values)
    template_path = os.path.join(os.path.dirname(__file__), HTML_PREFIX, 'front.html')
    self.response.out.write(template.render(template_path, template_values))

# Initiates the process of creating a flow for the user
class NewRound(webapp2.RequestHandler):
  def get(self):
    template_path = os.path.join(os.path.dirname(__file__), HTML_PREFIX, 'newround.html')
    self.response.out.write(template.render(template_path, None))
  def post(self):
    rnd = RoundModel()
    rnd.affSchool = self.request.POST['affschool']
    rnd.negSchool = self.request.POST['negschool']
    rnd.affTeam = self.request.POST['affteam']
    rnd.negTeam = self.request.POST['negteam']
    rnd.affFirstSpeaker = self.request.POST['1a']
    rnd.affSecondSpeaker = self.request.POST['2a']
    rnd.negFirstSpeaker = self.request.POST['1n']
    rnd.negSecondSpeaker = self.request.POST['2n']
    key = rnd.put()
    #logging.info('Key is %s' % key)
    self.redirect('/create?id=' + str(key.id()))

# Handles creating a flow for the user
class Create(webapp2.RequestHandler):
  def get(self):
    round_id = int(self.request.get('id'))
    rnd = RoundModel.get_by_id(round_id)
    logging.info('Round info is %s' % rnd)
    template_values = {
      'affSchool': rnd.affSchool,
      'negSchool': rnd.negSchool,
      'affTeam': rnd.affTeam,
      'negTeam': rnd.negTeam,
      '1a': rnd.affFirstSpeaker,
      '2a': rnd.affSecondSpeaker,
      '1n': rnd.negFirstSpeaker,
      '2n': rnd.negSecondSpeaker
    }
    template_path = os.path.join(os.path.dirname(__file__), HTML_PREFIX, 'create.html')
    self.response.out.write(template.render(template_path, template_values))

# Handles viewing a flow (initially not very different from create)
class View(webapp2.RequestHandler):
  def get(self):
    round_id = int(self.request.get('id'))
    rnd = RoundModel.get_by_id(round_id)
    logging.info('Round info is %s' % rnd)
    template_values = {
      'affSchool': rnd.affSchool,
      'negSchool': rnd.negSchool,
      'affTeam': rnd.affTeam,
      'negTeam': rnd.negTeam,
      '1a': rnd.affFirstSpeaker,
      '2a': rnd.affSecondSpeaker,
      '1n': rnd.negFirstSpeaker,
      '2n': rnd.negSecondSpeaker
    }
    template_path = os.path.join(os.path.dirname(__file__), HTML_PREFIX, 'view.html')
    self.response.out.write(template.render(template_path, template_values))

# Handles card CRUD
class Card(webapp2.RequestHandler):
  # Return JSON of all cards matching given round id
  def get(self):
    roundId = self.request.get('id')
    if roundId:
      cards = CardModel.all().filter('roundId ==', int(roundId)).order('cardNum').run(batch_size=50000)
      cardlist = []
      for card in cards:
        cardobj = {'text': card.text,
                   'cite': card.cite,
                   'speech': card.speech,
                   'topicId': card.topicId}
        cardlist.append(cardobj)
      self.response.out.write(json.dumps(cardlist))
  
  # Create or update the card
  def post(self):
    if self.request.get('action') == 'create':
      values = json.loads(self.request.POST.items()[0][0])
      
      card = CardModel()
      card.text = values['text']
      card.cite = values['cite']
      card.speech = values['speech']
      card.cardNum = values['cardNum']
      card.topicId = values['topicId']
      card.roundId = values['roundId']
      card.put()

# Handles topic CRUD
class Topic(webapp2.RequestHandler):
  # Return JSON of all topics matching given round id
  def get(self):
    roundId = self.request.get('id')
    if roundId:
      topics = TopicModel.all().filter('roundId ==', int(roundId)).order('topicId').run(batch_size=100)
      topiclist = []
      for topic in topics:
        topiclist.append(topic.topicName)
      self.response.out.write(json.dumps(topiclist))

  # Create or update the topic
  def post(self):
    if self.request.get('action') == 'create':
      values = json.loads(self.request.POST.items()[0][0])
      
      topic = TopicModel()
      topic.topicName = values['topicName']
      topic.topicId = values['topicId']
      topic.roundId = values['roundId']
      topic.put()