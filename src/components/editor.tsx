/* eslint-disable @typescript-eslint/no-explicit-any */
import { FileIcon } from '@/components/icons';
import '@fontsource/fira-code';
import Editor, { useMonaco } from '@monaco-editor/react';
import { useAtom } from 'jotai';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { currentFileAtom } from '../atoms';
import { useWs } from '../hooks/use-ws';
import { event } from '../types/fs';
import { Deploy } from './deploy';

const content = ``;

const useFileEditorAndFile = () => {
    const [currentFile] = useAtom(currentFileAtom);
    return { currentFile };
};

const DynamicTerminal = dynamic(() => import('../components/terminal-area'), {
    ssr: false,
});

const useUpdateFile = () => {
    const ws = useWs();
    const m = useMonaco();
    const { currentFile } = useFileEditorAndFile();

    useEffect(() => {
        if (ws && currentFile) {
            console.log('filequery', currentFile.path);
            ws.send(JSON.stringify({ type: 'fileQuery', data: currentFile.path }));
        }
    }, [currentFile, ws]);
    useEffect(() => {
        if (ws) {
            const handleFileQuery = (wsEvent: MessageEvent) => {
                const msg: { content: string } & event = JSON.parse(wsEvent.data);

                if (msg.type !== 'fileResponse') {
                    return;
                }

                const file = JSON.parse(msg.data);

                m?.editor
                    .getModels()
                    .find((x) => x.uri.path === file.path)
                    ?.setValue(file?.content);
            };
            ws?.addEventListener('message', handleFileQuery, {});
            return () => {
                ws?.removeEventListener('message', handleFileQuery);
            };
        }
    }, [ws, , m]);
};

const saveFile = (ws: WebSocket, m: any, currentFile: any) => {
    const file = {
        path: currentFile.path,
        content: m?.editor
            .getModels()
            .find((x: any) => x.uri.path === currentFile.path)
            ?.getValue(),
    };
    ws.send(JSON.stringify({ type: 'fileSave', data: JSON.stringify(file) }));
};

export function CodeEditor() {
    const { currentFile } = useFileEditorAndFile();
    useUpdateFile();
    const ws = useWs();
    const m = useMonaco();

    useEffect(() => {
        if (ws && currentFile) {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.keyCode == 83 && (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)) {
                    e.preventDefault();
                    saveFile(ws, m, currentFile);
                }
            };
            document.addEventListener('keydown', handleKeyDown, false);

            return () => document.removeEventListener('keydown', handleKeyDown, false);
        }
        // add a save file keybind
    }, [currentFile, m, ws]);

    return (
        <div className="w-full text-white h-screen">
            <div className="flex border-white/25 border-b w-full justify-between">
                <div className="flex px-4 py-2">
                    {currentFile && <FileIcon name={currentFile?.name} />} <div className="my-auto">{currentFile?.name ?? '​'} </div>
                </div>
                <Deploy />
            </div>

            <Editor
                defaultValue={content ?? ''}
                path={currentFile?.path}
                height="70vh"
                theme="hc-black"
                options={{
                    automaticLayout: true,
                }}
            />
            <DynamicTerminal />
        </div>
    );
}
