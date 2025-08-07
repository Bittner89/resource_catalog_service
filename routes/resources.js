import express from 'express';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { validateResource } from '../middleware/validation.js';
import { timeStamp } from 'console';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const data_file = path.join(__dirname, '../data', 'resources.json');
const feedback_file = path.join(__dirname, '../data', 'feedback.json')

router.get('/', (req, res, next) => {
    try {
        const data = readFileSync(data_file, 'utf8')
        let resources = JSON.parse(data);
        const { type, authorId } = req.query;
        if (type) {
            resources = resources.filter(r => r.type.toLowerCase() === type.toLowerCase());
        }
        if (authorId) {
            resources = resources.filter(r => r.authorId === authorId);
        }
        res.json(resources);
    } catch (error) {
        next(error);
    }
});

router.get('/:id', (req, res, next) => {
    try {
        const resourceId = req.params.id;
        const data = readFileSync(data_file, 'utf8')
        const resources = JSON.parse(data);
        const resource = resources.find(r => r.id === resourceId);

        if (resource) {
            res.json(resource);
        } else {
             res.status(404).json({ error: `Ressource mit ID ${resourceId} nicht gefunden.` })
        }

    } catch (error) {
        next(error);
    }
});


router.post('/', validateResource, (req, res, next) => {
    const newResourceData = req.body;

    const newResource = {
        id: uuidv4(),
        ...newResourceData
    };

    try {
        const data = readFileSync(data_file, 'utf8')
        const resources = JSON.parse(data);

        resources.push(newResource);

        writeFileSync(data_file, JSON.stringify(resources, null, 2), 'utf8');

        res.status(201).json(newResource);

    } catch (error) {
        next(error);
    }
});


router.put('/:id', (req, res, next) => {

    const resourceId = req.params.id;
    const newData = req.body;

    if (!newData || Object.keys(newData).length === 0) {
        res.status(400).json({ error: 'Keine Daten zum Aktualisieren vorhanden' });
        return;

    }

    try {
        const data = readFileSync(data_file, 'utf8')
        const resources = JSON.parse(data);


        const resourceIndex = resources.findIndex(r => r.id === resourceId);

        if (resourceIndex === -1) {
            res.status(404).json({ error: `Ressource mit Id ${resourceId} nicht gefunden.` });
            return;
        }

        resources[resourceIndex] = { ...resources[resourceIndex], ...newData };
        writeFileSync(data_file, JSON.stringify(resources, null, 2), 'utf8');

        res.status(200).json(resources[resourceIndex]);

    } catch (error) {
        next(error);
    }
});


router.delete('/:id', (req, res, next) => {

    const resourceId = req.params.id;

    try {
        const data = readFileSync(data_file, 'utf8')
        const resources = JSON.parse(data);


        const resourceIndex = resources.findIndex(r => r.id === resourceId);

        if (resourceIndex === -1) {
            res.status(404).json({ error: `Ressource mit Id ${resourceId} nicht gefunden.` });
            return;
        };

        resources.splice(resourceIndex, 1);
        writeFileSync(data_file, JSON.stringify(resources, null, 2), 'utf8');
        res.status(204).json({ error: "Löschung war erfolgreich." });

    } catch (error) {
        next(error);
    }
});

router.post('/:resourceId/feedback', (req, res, next) => {
    const resourceId = req.params.resourceId;
    const { feedbackText, userId } = req.body;

    if (!feedbackText || feedbackText.trim().length < 10 || feedbackText.trim().length > 500) {
        return res.status(400).json({ error: 'Feedback-Text muss zwischen 10 und 500 Zeichen lang sein.'});
    }
    const newFeedback = {
        id: uuidv4(), // Generiere eine eindeutige ID für diesen Feedback-Eintrag
        resourceId: resourceId, // Die ID der Ressource, zu der dieses Feedback gehört
        feedbackText: feedbackText.trim(), // Speichere den bereinigten Feedback-Text
        userId: userId || 'anonymous', // Verwende 'anonymous', wenn keine userId übergeben wird
        timestamp: new Date().toISOString() // Füge einen Zeitstempel hinzu, wann das Feedback erstellt wurde
    };

    try {
        const data = readFileSync(feedback_file, 'utf-8');
        const feedback = JSON.parse(data);
        feedback.push(newFeedback);
        const newFeedbackData = JSON.stringify(feedback, null, 2);
        writeFileSync(feedback_file, newFeedbackData, 'utf-8');
        res.status(201).json(newFeedback);
    }catch (error) {
        console.error('Fehler beim Schreiben des Feedbacks in die Datei:', error);
        next(error);
    }
});

export default router;