/* =====================================================
   LISTA DE NOMES – EDITE AQUI
   Basta substituir os textos de cada mesa.
   Se uma lista ficar vazia ou incompleta, os lugares
   restantes aparecem como "Lugar 1", "Lugar 2", etc.

   O código de cada mesa (V1, I1, A1...) é o mesmo que aparece
   escrito dentro dela no croqui.

   Posição dos códigos no salão (visto de cima):

      V1   V2   V3   V4   V5   V6   V7
           V8   V9   V10  V11  V12  V13
                    [ ALUNOS ]
           V14  I1   A1   A2   V15  V16
      V17  V18  I2   I3   I4   V19  V20
   ===================================================== */

const NOMES = {

  // Mesa retangular dos formandos (20 lugares)
  ALUNOS: [
    // "Cadete Fulano", "Cadete Beltrano", ...
  ],

  // Mesas da equipe de instrução e convidados (8 lugares cada)
  I1: [],
  I2: [],
  I3: [],
  I4: [],

  // Mesas das autoridades do Batalhão e convidados (8 lugares cada)
  A1: ["CMT Batlhão","Convidado CMT","CAP Bianquini","Convidado CAP","CAP Jean Rafael","Convidado CAP","SCMT Batalhão","Convidado SCMT"],
  A2: ["ADJ CMD","Convidado ADJ CMD","Presidente AORE","Convidado Presidente AORE","Vice-Presidente AORE","Convidado Vice-Presidente AORE"],

  // Mesas dos convidados dos alunos (8 lugares cada)
  V1: [],  V2: [],  V3: [],  V4: [],  V5: [],
  V6: [],  V7: [],  V8: [],  V9: [],  V10: [],
  V11: [], V12: [], V13: [], V14: [], V15: [],
  V16: [], V17: [], V18: [], V19: [], V20: []
};