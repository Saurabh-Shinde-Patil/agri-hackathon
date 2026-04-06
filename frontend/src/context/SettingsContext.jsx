import { createContext, useContext, useState, useEffect } from 'react';
import api from '../config/api';

const SettingsContext = createContext();

export function useSettings() {
    return useContext(SettingsContext);
}

export function SettingsProvider({ children }) {
    const [modeSelectionEnabled, setModeSelectionEnabled] = useState(false);
    const [loadingSettings, setLoadingSettings] = useState(true);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/settings/public');
            setModeSelectionEnabled(response.data.modeSelectionEnabled);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            // Default to false (hide) if network fails
            setModeSelectionEnabled(false);
        } finally {
            setLoadingSettings(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const updateSettings = async (newState) => {
        try {
            await api.put('/settings/admin', { modeSelectionEnabled: newState });
            setModeSelectionEnabled(newState);
        } catch (error) {
            console.error('Failed to update settings:', error);
            throw error;
        }
    };

    return (
        <SettingsContext.Provider value={{ modeSelectionEnabled, loadingSettings, updateSettings, fetchSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}
