/* Mermaid diagrams, with the colours from Ghost's code injection (gruvbox light). */
/* global mermaid */
mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
        primaryColor: '#fbf1c7',        /* node background */
        primaryTextColor: '#3c3836',    /* node text */
        secondaryColor: '#3c3836',      /* node border / secondary background */
        edgeLabelBackground: '#fbf1c7',
        lineColor: '#98971a',           /* arrows and strokes */
        clusterBkg: '#fbf1c7',
        clusterBorder: '#504945',
        tertiaryColor: '#504945',
        fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
        accentColor: '#fe8019',         /* orange */
        nodeTextColor: '#3c3836'
    }
});
mermaid.run({ querySelector: '.mermaid' });
