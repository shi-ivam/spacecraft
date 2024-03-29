import { atom, useAtomValue } from 'jotai';

const wsAtom = atom<WebSocket | undefined>(undefined);

let wsSet = false;

wsAtom.onMount = (setAtom) => {
    if (!wsSet && typeof window !== 'undefined') {
        wsSet = true;
        const ws = new WebSocket('wss:/h-production.up.railway.app/');
        ws.onopen = () => {
            setAtom(ws);
        };
    }
};

export function useWs() {
    return useAtomValue(wsAtom);
}
