Sons chargés à l'exécution (runtime)
====================================

Ce dossier accueille les sons qui ne peuvent pas être livrés avec le dépôt
(assets Microsoft sous copyright). Ils sont chargés à l'exécution via
`new Audio(import.meta.env.BASE_URL + 'sounds/<fichier>')`, avec un `.catch()`
qui ignore silencieusement l'absence du fichier — le build reste donc vert sans
eux.

Fichier attendu
---------------
  windows-xp-logoff.mp3   Son de fermeture de session de Windows XP.
                          Joué par l'écran de fin de session
                          (src/components/templates/WindowsXPLogoffScreen).

Pour l'activer : déposer le fichier ci-dessus dans ce dossier, en conservant
exactement ce nom. Aucune autre modification n'est nécessaire.
