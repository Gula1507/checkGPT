## Roadmap
- [Roadmap/Backlog](https://github.com/users/Gula1507/projects/2)
- [Milestones](https://github.com/Gula1507/checkGPT/milestones)

## DoD
- Issue ist im Sprint Backlog eindeutig beschrieben und vollständig umgesetzt
- Alle Akzeptanzkriterien (wenn sinnvoll) des Issues sind erfüllt und nachvollziehbar dokumentiert
- Code ist (falls nötig) im entsprechenden GitHub-Repository committed und mit dem Issue verknüpft
- Pull Request ist (falls nötig) im Test-Branch erstellt, aktuell und ohne offene Kommentare
- Code Review wurde mindestens von einer weiteren Person durchgeführt und freigegeben
- Prüfen, dass in keiner Weise personenbezogene Daten über den Code gespeichert oder offengelegt werden
- Build ist erfolgreich durchgelaufen
- QM-Prüfung (funktional und ggf. fachlich) ist abgeschlossen und dokumentiert
- QM-Reviewer erzeugt eine neue Pull-Request aus Test-Branch für den Main-Branch, welches durch den ursprünglichen Entwickler approved wird
- Relevante Dokumentation (README, Kommentare, Wiki) ist aktualisiert
- Issue ist in GitHub korrekt abgeschlossen und dem Sprint als „Done“ zugeordnet

## Ticket-Management
1. NAMING
Wenn ein neues Ticket erstellt und ein Branch angelegt wird, soll ein nachvollziehbares Branch-Naming genutzt werden.
````
Bei neuen Features:
feature/ticketnummer-name-des-features
Bei Bugfixes:
bugfix/ticketnummer-name-des-bugfixes
````

2. BRANCH LÖSCHEN
Die Person, die den Branch erstellt hat, sollte diesen auch wieder löschen – idealerweise dann, wenn der Branch gemergt wurde oder nicht mehr benötigt wird und die QS abgeschlossen und erfolgreich war.

3. TICKET WORKFLOW
Nach jedem Code-Review und nach der QS sollte das Ticket wieder an den Ticket-Besitzer (die Person, die die Inhalte umsetzt) im Kanban Board zurückgegeben werden. 
Diese Person verschiebt das Ticket anschließend weiter. Das hilft, bei den einzelnen Tickets den Überblick zu behalten.
Nach Bearbeitung des Tickets wird die DoD geprüft. Sind alle Punkte sichergestellt, soll das Ticket geschlossen werden (auf Done setzen)
Bei der Sprint Retro und dem Planning werden die geschlossenen Tickets aus dem Done ins Archiv verschoben.
