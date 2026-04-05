import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../locales/en.json';
import hi from '../locales/hi.json';
import mr from '../locales/mr.json';

const dictionaries = { en, hi, mr };

const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('agrishield_lang') || 'en';
    });

    useEffect(() => {
        localStorage.setItem('agrishield_lang', language);
    }, [language]);

    // Simple dot notation translation hook: t('nav.dashboard')
    const t = (keyStr) => {
        const keys = keyStr.split('.');
        let current = dictionaries[language];
        for (const key of keys) {
            if (current[key] === undefined) {
                // Fallback to english if missing key
                let fallback = dictionaries['en'];
                for (const fbKey of keys) {
                    if (!fallback || fallback[fbKey] === undefined) return keyStr; 
                    fallback = fallback[fbKey];
                }
                return fallback;
            }
            current = current[key];
        }
        return current;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};
