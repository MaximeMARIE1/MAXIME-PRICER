# Maxime MARIE Derivatives Pricer

Application web statique pour pricer des options europeennes avec Black-Scholes.

Interface personnalisee avec une palette desk bleu nuit.

## Contenu

- Prix call/put, forward et cash delta
- Greeks unitaires et cash greeks
- Gamma PnL calculator
- Raccourcis trading et analyse early exercise indicative
- Graphiques price/greeks vs spot, volatilite, strike et temps

## Lancer le projet

Ouvrir simplement `index.html` dans un navigateur moderne.

Les graphiques utilisent Chart.js via CDN, donc une connexion internet est recommandee au premier chargement.

## Hypotheses

- Dividende continu `q`
- Repo continu ajoute au carry de dividende
- Volatilite annualisee
- Base temps ACT/365.25
- Greeks vega et rho exprimes pour un mouvement de 1 point de pourcentage

