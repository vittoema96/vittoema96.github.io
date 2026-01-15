import React, {useMemo, useEffect, useState} from 'react'
import type {AidItem, ApparelItem, GenericItem, ModItem, WeaponItem} from '@/types'
import {GameDataRepository} from "@/services/GameDataRepostory.ts";
import { GameDatabaseContext } from "@/hooks/useGameDatabase";



// --- Interfaces ---

interface DatabaseCollections {
    weapon: Record<string, WeaponItem>;
    apparel: Record<string, ApparelItem>;
    aid: Record<string, AidItem>;
    other: Record<string, GenericItem>;
    mod: Record<string, ModItem>;

    perks: Record<string, any>;
}

export interface GameDatabaseContextValue extends DatabaseCollections {
    isReady: boolean;
}


// --- CACHE OBJECT ---

let dbCache: DatabaseCollections = {
    weapon: {},
    apparel: {},
    aid: {},
    other: {},
    mod: {},
    perks: {}
}


export function DatabaseProvider({ onReady, children}:
                                 { onReady: () => void; children: React.ReactNode }) {
    // Track loading state (only state we need)
    const [isReady, _setIsReady] = useState(false)
    const setIsReady = (value: boolean) => {
        _setIsReady(value)
        if (value) onReady()
    }

    // Load all CSV data on mount
    useEffect(() => {
        if (isReady) return

        const init = async () => {
            try {
                dbCache = await GameDataRepository.loadAllData();
                console.log('Database loaded successfully')
            } catch (err) {
                console.error("Failed to initialize game database:", err);
            } finally {
                setIsReady(true)
                onReady()
            }
        }
        init().then(() => console.log('Database initialization finished.'))
    }, [isReady])

    const value = useMemo(() => {
        return {
            ...dbCache,
            isReady,
        }
    }, [isReady])

    return (
        <GameDatabaseContext.Provider value={value}>
            {isReady ? children : null}
        </GameDatabaseContext.Provider>
    )
}
