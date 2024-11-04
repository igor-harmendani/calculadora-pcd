# Calculadora de Portabilidade de Crédito (PCD)

Em alguns casos, o extrato de consignação do cliente não nos fornece dados essenciais para o correto cálculo do saldo devedor, como taxa de juros e valor liberado. O objetivo dessa ferramenta é realizar este cáculo, resultando em valores aproximados aos valores reais.

## Aviso
Não há garantia de que os valores calculados pela aplicação condizam com a realidade. Não me responsabilizo pelos dados fornecidos por esta aplicação. **NÃO DEPENDA DESSA APLICAÇÃO PARA ENTREGAR SUAS METAS.**

## Método
A aplicação busca determinar qual foi a taxa de juros utilizada em determinada operação de crédito consignado, levando em conta dados públicos divulgados pelo Banco Central. A partir de valores inseridos pelo usuário, como quantidade total de parcelas e quantidade de parcelas pagas, é feito um cálculo de subtração de datas, isto é, uma "volta no tempo" até a data em que a operação foi contratada.


## Exemplo
Sabemos que uma operação de crédito consignado do estado de Minas Gerais foi contratada no Banco A, que a quantidade total de parcelas é 96, que a próxima parcela a vencer será a 8ª e que o valor faltante é de R$ 2314,00. Como descobrir o saldo devedor atual, sem informações sobre taxa de juros ou valor liberado?

Para ajudar nisso, a aplicação executará os seguintes passos:

* Descobrir qual a data atual
* Subtrair 7 meses da data atual, isto é, "voltar 7 meses" e obter a data aproximadada de contratação
* Consultar a API pública do Banco Central para obter a taxa média mensal do Banco A naquele período.
* Obter o valor liberado na contratação e fazer o cálculo de valor presente para obter o saldo devedor atual.
 
## Possíveis problemas

A aplicação não considera amortizações ou liquidações, uma vez que não há como obter esse tipo de informação publicamente.

## Licença
[![CC BY 4.0][cc-by-shield]][cc-by]

This work is licensed under a
[Creative Commons Attribution 4.0 International License][cc-by].

[![CC BY 4.0][cc-by-image]][cc-by]

[cc-by]: http://creativecommons.org/licenses/by/4.0/
[cc-by-image]: https://i.creativecommons.org/l/by/4.0/88x31.png
[cc-by-shield]: https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg
Para uso interno do Banco do Brasil.
