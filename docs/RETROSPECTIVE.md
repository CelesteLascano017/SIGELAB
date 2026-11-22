# Retrospectiva

> Plantilla honesta: no se simula una reunión que no ocurrió. El equipo (Dax Navarreta, Celeste Lascano, Anndy Rengifo) debe completar las secciones tras realizarla. Debajo, observaciones del desarrollo asistido.

## Observaciones del desarrollo (reales)
- Bien: las reglas críticas se probaron primero en BD, lo que detectó temprano un test mal planteado (RLS filtra en silencio en `delete`, no lanza error).
- Mal: el prototipo interactivo no fue legible desde el enlace; se trabajó solo con el PDF. Las HU completas no estaban disponibles.
- Mal: las pruebas con PGlite no detectaron que GoTrue asigna `app_metadata` con un UPDATE posterior al INSERT; solo apareció al probar contra Supabase real (migración 04). Lección: probar pronto contra el entorno real.
- Bien: las pruebas de navegador encontraron bugs de UX (error obsoleto de capacidad, hidratación, contraste) que ni tsc ni build mostraban.

## Acciones de mejora propuestas (a aprobar por el equipo)
1. Ejecutar `npm run test:live` y `npm run test:e2e` antes de cada entrega (ya existen) y añadirlos a la CI del repositorio. Responsable/fecha: _por definir_.
2. Compartir las HU en texto (no solo PDF) en el repositorio. Responsable/fecha: _por definir_.

## Retrospectiva del equipo (completar)
- Fecha: ____  Asistentes: ____
- Qué funcionó / Qué no / Acuerdos: ____
