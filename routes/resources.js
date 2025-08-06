import express from 'express';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';


const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const data_file = path.join(__dirname, '../data', 'resources.json');

router.get('/', (req, res) => {
    try {
        const data = readFileSync(data_file, 'utf8')
        const resources = JSON.parse(data);
        res.json(resources);
    } catch (error) {
        res.status(500).json({ error: 'Interner Serverfehler beim Laden der Daten.' })
    }
});

router.get('/:id', (req, res) => {
    try {
        const resourceId = req.params.id;
        const data = readFileSync(data_file, 'utf8')
        const resources = JSON.parse(data);
        const resource = resources.find(r => r.id === resourceId);

        if (resource) {
            res.json(resource);
        } else {
            res.status(404).json({ error: 'Ressource mit ID ${resourceId} nicht gefunden.' })
        }


    } catch (error) {
        res.status(500).json({ error: 'Interner Serverfehler beim Laden der Daten.' })
    }
});


router.post('/', (req, res) => {
    const newData = req.body;

    if (!newData.title || !newData.type) {
        res.status(400).json({ error: 'title und type sind erforderlich.' });
        return;
    }

    const newResource = {
        id: uuidv4(),
        ...newData
    }

    try {
        const data = readFileSync(data_file, 'utf8')
        const resources = JSON.parse(data);

        resources.push(newResource);

        writeFileSync(data_file, JSON.stringify(resources, null, 2), 'utf8');

        res.status(201).json(newResource);

    } catch (error) {
        res.status(500).json({ error: 'Interner Serverfehler bei der Verarbeitung der Resourcen-Daten.' })
    }


});


router.put('/:id', (req, res) => {
    
    const resourceId = req.params.id;
    const newData = req.body;

    if (!newData || Object.keys(newData).length === 0) {
        res.status(400).json({error: 'Keine Daten zum Aktualisieren vorhanden'});
        return;

    }

    try {
        const data = readFileSync(data_file, 'utf8')
        const resources = JSON.parse(data);


        const resourceIndex = resources.findIndex(r => r.id === resourceId);

        if(resourceIndex === -1) {
            res.status(404).json({error: `Ressource mit Id ${resourceId} nicht gefunden.`});
            return;
        }

            resources[resourceIndex] = {...resources[resourceIndex], ...newData};
            writeFileSync(data_file, JSON.stringify(resources, null, 2), 'utf8');

            res.status(200).json(resources[resourceIndex]);

    } catch(error) {
        res.status(500).json({ error: 'Interner Serverfehler bei der Verarbeitung der Resourcen-Daten.' })
    }



});

export default router;