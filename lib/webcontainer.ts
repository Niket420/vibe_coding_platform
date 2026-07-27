import { WebContainer } from "@webcontainer/api";

let webcontainerPromise: Promise<WebContainer> | null = null;

export function getWebContainer() {
    if (!webcontainerPromise) {
        webcontainerPromise = WebContainer.boot();
    }

    return webcontainerPromise;
}