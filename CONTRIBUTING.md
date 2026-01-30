# Contributing Guidelines
## Ticket-Management
### Erstellen
Beim Erstellen von Tickets wird generell auf eine einfache und informative Schreibweise geachtet. Der [Code of Conduct](https://github.com/Gula1507/checkGPT?tab=coc-ov-file) ist einzuhalten.
Der Ticket-Titel ist kurz und verständlich anzulegen. Falls Möglich sollten die Akzeptanzkriterien direkt hinterlegt werden. Andernfalls werden sie später durch das Team ergänzt.
Akzeptanzkriterien sind entweder in Stichpunkten oder Checkbox-Elementen anzulegen

### Labels
Tickets sollten in jedem Fall mindestens ein Label zugeordnet bekommen. Es wird unterschieden zwischen:
- Bug: Allgemeine Markierung von Fehlern/Bug Reports
- DevOps: *intern* Integration und Deployment
- Documentation: Zur Anpassung von allgemeinen Dokumentationen oder dem Wiki
- Epic: *intern* Sammlung von User Stories
- User Story: *intern* User Story erstellt durch das Team oder Transferiert aus einem Feature
- Feature: Allgemeine Feature Request zur Erweiterung des Tools
- Overhead: *intern* Overhead des gesamten Projekts
- Product Research: *intern* Beschaffung von Informationen und Nutzungsverhalten zum Produkt
- Quality & Tests: *intern* Qualitätssicherung und explizite Tests

### Ticket-Management
- Nach jedem Code-Review und nach der QS sollte das Ticket wieder an den Ticket-Besitzer (die Person, die die Inhalte umsetzt) im Kanban Board zurückgegeben werden.
- Diese Person verschiebt das Ticket anschließend weiter (In Progress, Code Review bei neuem Code, QS nach neuem Merge). Das hilft, bei den einzelnen Tickets den Überblick zu behalten.
Nach Bearbeitung des Tickets wird die DoD geprüft. Sind alle Punkte sichergestellt, soll das Ticket geschlossen werden (auf Done setzen)
- Bei der Sprint Retro und dem Planning werden die geschlossenen Tickets aus dem Done ins Archiv verschoben.

## Branch-Management
### Test-Branching
Branch-Protection ist aktiv! Eine Pull-Request ist nur auf den Test-Branch zulässig. Die Code-Review findet auf diesem Branch statt. Nach erfolgreicher Überprüfung am Ende eines Sprints oder bei besonderen Feaures wird der Test-Branch in den Main-Branch gemerged.

### Naming
Wenn eine neue Pull-Request erstellt und ein Branch angelegt wird, soll ein nachvollziehbares Branch-Naming genutzt werden.
````
Bei neuen Features:
feature/ticketnummer-name-des-features
Bei Bugfixes:
bugfix/ticketnummer-name-des-bugfixes
````

### Branch löschen
Die Person, die den Branch erstellt hat, sollte diesen auch wieder löschen – idealerweise dann, wenn der Branch gemergt wurde oder nicht mehr benötigt wird und die QS abgeschlossen und erfolgreich war.

## Definition of Done (DoD)
- Issue ist im Sprint Backlog eindeutig beschrieben und vollständig umgesetzt
- Alle Akzeptanzkriterien (wenn sinnvoll) des Issues sind erfüllt und nachvollziehbar dokumentiert
- Code ist (falls nötig) im entsprechenden GitHub-Repository committed und mit dem Issue verknüpft
- Pull Request ist (falls nötig) im Test-Branch erstellt, aktuell und ohne offene Kommentare
- Code Review wurde mindestens von einer weiteren Person durchgeführt und freigegeben
- Prüfen, dass in keiner Weise personenbezogene Daten über den Code gespeichert oder offengelegt werden
- Build ist erfolgreich durchgelaufen
- QM-Prüfung (funktional und ggf. fachlich) ist abgeschlossen und dokumentiert (inkl. kopierter Akzeptanzkriterien und Markierung aller mit dem Checkmark-Emoji = bestanden)
- An verantwortlichen Entwickler assignen
- Relevante Dokumentation (README, Kommentare, Wiki) ist aktualisiert
- Issue ist in GitHub korrekt abgeschlossen und dem Sprint als „Done“ zugeordnet

## Releases
Releases werden normalerweise am Ende eines Sprints über Merge von Test zu Main oder bei besonderen Features als neue Version erstellt.
Die [Releases](https://github.com/Gula1507/checkGPT/releases) sind über GitHub im entsprechenden Tab vorhanden. Hierbei wird sich an das offozielle [Semantic Versioning](https://semver.org/) gehalten.

## Roadmap
- [Roadmap/Backlog](https://github.com/users/Gula1507/projects/2)
- [Milestones](https://github.com/Gula1507/checkGPT/milestones)