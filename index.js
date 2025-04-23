const express = require('express')
const app = express()
const morgan  = require('morgan')
require('dotenv').config()
const Person = require('./models/person')
app.use(express.json())
morgan.token('request-body', (request, response) =>
    {
        return JSON.stringify(request.body)
    })
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :request-body'))
app.use(express.static('dist'))

app.get('/api/persons', (request, response) => {
    Person.find({}).then(persons =>{
        response.json(persons)
    })
})

app.get('/info', (request, response) => {
    const date= new Date()
    Person.find({}).then(persons =>{
        response.send(`
            <div>
                Phonebook has info for ${persons.length} people
                <p> ${date.toString()} </p>
            </div>
            `)
    })
    
})

app.get('/api/persons/:id', (request, response, next) =>{
    Person.findById(request.params.id)
        .then(person => {
            if(person)
            {
                response.json(person)
            }else{
                response.status(204).end()
            }
        })
        .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
    Person.findByIdAndDelete(request.params.id)
    .then(result => {
        response.status(204).end()
    })
    .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
    const body = request.body

    if(!body.name || !body.number)
    {
        return response.status(400).json({
            error : "name or number missing"
        })
    }

   /* if(persons.some(person => person.name === body.name))
    {
        return response.status(400).json({
            error : "Le nom existe déjà"
        })
    }*/

    const person = new Person({
        name: body.name,
        number: body.number,
    })

    person.save().then(savedPerson => {
        response.json(savedPerson)
    })
    .catch(error=> next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
    const { name, number } = request.body
  
    Person.findById(request.params.id)
      .then(person => {
        if (!person) {
          return response.status(404).end()
        }
  
        person.name = name
        person.number = number
  
        return person.save().then((updatedPerson) => {
          response.json(updatedPerson)
        })
      })
      .catch(error => next(error))
  })

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
  }
  
  app.use(unknownEndpoint)


const errorHandler = (error, request, response, next) => {
    console.error(error.message)
  
    if (error.name === 'CastError') {
      return response.status(400).send({ error: 'malformatted id' })
    } else if(error.name === 'ValidationError')
    {
        return response.status(400).json({error: error.message})
    }
  
    next(error)
  }
  
  // this has to be the last loaded middleware, also all the routes should be registered before this!
  app.use(errorHandler)

const PORT = 3001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})