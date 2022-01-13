import React, {createElement, FC, ReactNode} from "react";

const wrapProvider = (wrappers: (FC | string | undefined)[], component: (FC | string)) => {
    const reactElements = [...wrappers, component];
    const create = (i: number): ReactNode => {
        const Provider = reactElements[i];
        if(!Provider) return null;
        if(typeof Provider ==='string') return createElement(Provider, null, create(i+1));
        return (<Provider>{create(i+1)}</Provider>)
    }
    return create(0);
}

export default wrapProvider;