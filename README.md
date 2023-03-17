# On call queue tool

- Teams information are stored on data folder
- There you can create the teams that will handle the OnCall and set the last on call date
- This script helps to create a queue of next on call persons
- It is based in one available persons per team and a team rotation FIFO
- It is possible to ignore some persons to not be eligible (set ignore=true on data file)
- The idea is create a queue considering the last date on call and team rotation

## Setup

````
npm ci
````

# How to generate the next on call queue

1) Edit and update the last on call dates for the persons on ./data/teamsData.json
2) Run the command
````
npm start
````
3) The next on call persons will be generate on console out + output folder(json & csv)

## Set a specific start date and numbers of persons

````
NUMBER_OF_PERSONS=20 START_DATE=2023-03-13  npm start
````

## Forcing the first person to be choosen
````
 PRIORITISE_PERSON_NAME="Person Blue C" NUMBER_OF_PERSONS=3 npm start
 ````

# Example of output

`````
[
  {
    index: 1,
    name: 'Person yellow C',
    team: 'yellow',
    expectedDate: '2023-03-17'
  },
  {
    index: 2,
    name: 'Person Blue B',
    team: 'blue',
    expectedDate: '2023-03-19'
  },
  {
    index: 3,
    name: 'Person Red C',
    team: 'red',
    expectedDate: '2023-03-24'
  },
  {
    index: 4,
    name: 'Person yellow A',
    team: 'yellow',
    expectedDate: '2023-03-26'
  },
  {
    index: 5,
    name: 'Person Blue C',
    team: 'blue',
    expectedDate: '2023-03-31'
  }
]
````
