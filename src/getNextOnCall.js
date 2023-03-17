
import { readFileSync, writeFileSync} from 'fs';
import Papa from 'papaparse'

const DEBUG_ENABLE = false
const UPDATE_DATA_FILE=false

const findPersonLastOnCallPerson = (persons) => {
    let lastOnCallPerson = persons[0]
    persons.forEach(person => {
        if (person.lastOncallDate < lastOnCallPerson.lastOncallDate) {
            lastOnCallPerson = person
        }
    });
    return lastOnCallPerson
}

const findNextAvailablePersonsOfEachTeam = (teams) => {
    return teams.map((team) => (
        {
            team: team.name, 
            person: findPersonLastOnCallPerson(team.persons.filter(person => person.ignore != true))
        }
    )
    )
}

const dequeueNextTeamOnCall = (logTeamsOnCall) => {
    const nextTeamOnCall = logTeamsOnCall[0]
    logTeamsOnCall.shift()
    logTeamsOnCall.push(nextTeamOnCall)
    return nextTeamOnCall
}

const findNextPersonOnCall= (lastOnCallsPersonsOfEachTeam, nextTeamOnCall) => {
    return lastOnCallsPersonsOfEachTeam.find((nextPerson) => nextPerson.team == nextTeamOnCall)
}

const updateLastOnCallDate = (teams, personName, baseDate) => {
    teams.forEach(team => {
      const person = team.persons.find(p => p.name === personName)
      if (person) {
        person.lastOncallDate = baseDate.toISOString().split('T')[0]
      }
    })
}

const debug = (msg, data) => {
    if (!DEBUG_ENABLE) return
    console.log(`\n # ${msg}`)
    console.log(data)
}

const defineNextPersonOnCall = (teamsData, baseDate, forcePersonOncallName) =>  {
    const teams = teamsData.teams
    const queueTeamsOnCall = teamsData.queueTeamsOnCall
    debug("Current queue teams on call", queueTeamsOnCall)
    const nextAvailablePersonsForOfTeam = findNextAvailablePersonsOfEachTeam(teams)
    debug("Next available persons of each team", nextAvailablePersonsForOfTeam)
    const nextTeamOnCall = dequeueNextTeamOnCall(queueTeamsOnCall)
    debug("Next team Oncall", nextTeamOnCall)
    const nextPersonOnCall = findNextPersonOnCall(nextAvailablePersonsForOfTeam, nextTeamOnCall)
    debug("Next person on call", nextPersonOnCall)
    updateLastOnCallDate(teams, nextPersonOnCall.person.name, baseDate)
    return {
        nextPersonOnCall: nextPersonOnCall,
        data: {
            queueTeamsOnCall,
            teams
        }
    }
}

const writeOutputfiles = (teamsData, queueData) => {
    const dateKey = new Date().toISOString().split('T')[0]
    if (UPDATE_DATA_FILE) {
        writeFileSync('./data/teamsData.json',JSON.stringify(teamsData, null, 2),  'utf-8');
    }
    writeFileSync(`./output/nextOnCallPersons-${dateKey}.json`, JSON.stringify(queueData, null, 2),  'utf-8');
    writeFileSync(`./output/nextOnCallPersons-${dateKey}.csv`, Papa.unparse(queueData),  'utf-8');
}

const checkAndHandlePriorityPerson = ()=> {
    const priorityPersonName = process.env.PRIORITISE_PERSON_NAME
    if (priorityPersonName) {
        const priorityPersonTeam = teamDataFile.teams.find( team => {
            const person = team.persons.find(person => person.name == priorityPersonName)
            if (person) {
                person.lastOncallDate = '2001-01-01' //set a old date to be choosen later
                debug("Priority person", person)
                return team.name
            }
        })
        if (priorityPersonTeam) {
            const teamName = priorityPersonTeam.name
            const queueTeamsOnCall = teamDataFile.queueTeamsOnCall
            const index = queueTeamsOnCall.indexOf(teamName);
            if (index > -1) {
                queueTeamsOnCall.splice(index, 1);
                queueTeamsOnCall.unshift(teamName);
            }
        }
        debug("New team priority", teamDataFile.queueTeamsOnCall)
    }
}

let teamDataFile = JSON.parse(readFileSync('./data/teamsData.json', 'utf-8'));
let response = {data: teamDataFile}
checkAndHandlePriorityPerson(teamDataFile)
let baseDate = process.env.START_DATE ? new Date(process.env.START_DATE) : new Date()
const numberOfPersons= process.env.NUMBER_OF_PERSONS || 5
debug("Base date", baseDate)
const queueData = []

for (let index = 0; index < numberOfPersons; index++) {
    response =  defineNextPersonOnCall(response.data, baseDate)
    const multiplierMondAndWed = index % 2 == 0 ? 2 : 5
    baseDate.setDate(baseDate.getDate() + multiplierMondAndWed);
    queueData.push(
        {
            index: index+1, 
            name: response.nextPersonOnCall.person.name, 
            team: response.nextPersonOnCall.team,
            expectedDate: response.nextPersonOnCall.person.lastOncallDate
        }
    )
}

writeOutputfiles(response.data, queueData)
console.log(queueData)
