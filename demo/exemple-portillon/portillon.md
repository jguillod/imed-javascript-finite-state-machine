cf. [Exemple du portillon (wikipédia)](https://fr.wikipedia.org/wiki/Automate_fini#Un_premier_exemple_:_un_portillon)

<img src="Automate_de_portillon.svg" alt="(Automate_de_portillon)">


> **Citation de wikipédia :**
>
> Un exemple très simple d'un mécanisme que l'on peut modéliser par un automate fini est un Portillon d'accès1,2. Un portillon, utilisé dans certains métros ou dans d'autres établissements à accès contrôlés est une barrière avec trois bras rotatifs à hauteur de la taille. Au début, les bras sont verrouillés et bloquent l'entrée, et empêchent les usagers de passer. L'introduction d'une pièce de monnaie ou d'un jeton dans une fente du portillon (ou la présentation d'un ticket ou d'une carte) débloque les bras et permet le passage d'un et un seul usager à la fois. Une fois l'usager entré, les bras sont à nouveaux bloqués jusqu'à ce qu'un nouveau jeton soit inséré.
> 
> Un portillon, vu comme un automate fini, a deux états : verrouillé (« locked » en anglais) et déverrouillé (« unlocked » en anglais)1. Deux « entrées » peuvent modifier l'état : la première si l'on insère un jeton dans la fente (entrée jeton) et la deuxième si l'on pousse le bras (entrée pousser). Dans l'état verrouillé, l'action de pousser n'a aucun effet : quel que soit le nombre de fois que l'on pousse, l'automate reste verrouillé. Si l'on insère un jeton, c'est-à-dire si l'on effectue une « entrée » jeton, on passe de l'état verrouillé à l'état déverrouillé. Dans l'état déverrouillé, ajouter des jetons supplémentaires n'a pas d'effet, et ne change pas l'état. Mais dès qu'un usager tourne le bras du portillon, donc fournit un pousser, la machine retourne à l'état verrouillé.
> 
> L'automate d'un portillon peut être représenté par une table de transition d'états qui montre, pour chaque état, le nouvel état et la sortie (l'action) pour une entrée donnée.
> 
> <table class="wikitable">
<tbody><tr>
<th>État courant</th>
<th>Entrée</th>
<th>État suivant</th>
<th>Sortie</th>
</tr>
<tr>
<td rowspan="2">verrouillé</td>
<td>jeton</td>
<td>déverrouillé</td>
<td>Déverrouille le portillon pour qu'un usager puisse passer</td>
</tr>
<tr>
<td>pousser</td>
<td>verrouillé</td>
<td>Rien</td>
</tr>
<tr>
<td rowspan="2">déverrouillé</td>
<td>jeton</td>
<td>déverrouillé</td>
<td>Rien</td>
</tr>
<tr>
<td>pousser</td>
<td>verrouillé</td>
<td>Quand l'usager est passé, verrouille le portillon</td>
</tr>
</tbody></table>
> On peut aussi représenter l'automate par un graphe orienté appelé un diagramme états-transitions, comme donné ci-dessus. Chaque état est représenté par un sommet (visualisé par un cercle). Les arcs (représentés par des flèches) montrent les transitions d'un état à un autre. Chaque flèche porte une entrée qui déclenche la transition. Les données qui ne provoquent pas de changement d'état, comme un jeton pour l'état déverrouillé, sont représentées par des arcs circulaires (des boucles) qui tournent autour de l’état. La flèche qui entre dans l'état verrouillé depuis le point noir sert à indiquer que cet état est l'état initial, au début de la modélisation.

