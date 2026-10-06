import type React from 'react';
import {Comparacao} from './Comparacao';
import {Dinheiro} from './Dinheiro';
import {Grafico} from './Grafico';

/**
 * Registro de cenas usadas em motion.json ({"type": "scene", "name": "<chave>"}).
 * Cena nova = arquivo novo nesta pasta + uma linha em SCENES + um exemplo em EXEMPLOS.
 * Cada cena registrada vira a composição "cena-<Nome>" para pré-visualizar:
 *   ./ae cena <Nome> <segundos> [card|full]
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SCENES: Record<string, React.FC<any>> = {
  Grafico,
  Comparacao,
  Dinheiro,
};

/** Props de exemplo (e duração em segundos) usadas só na pré-visualização "cena-<Nome>". */
export const EXEMPLOS: Record<string, {props: Record<string, unknown>; dur?: number}> = {
  Grafico: {
    props: {title: 'Caixa no mês', prefix: 'R$ ', suffix: ' mil', bars: [{label: 'Jan', value: 12}, {label: 'Fev', value: 18}, {label: 'Mar', value: 31}]},
  },
  Comparacao: {
    props: {title: 'Por que quebra?', left: {label: 'Falta de cliente', value: 'Raro', emoji: '🙋'}, right: {label: 'Falta de caixa', value: 'Quase sempre', emoji: '💸'}},
  },
  Dinheiro: {props: {label: 'Controle o caixa'}},
};
