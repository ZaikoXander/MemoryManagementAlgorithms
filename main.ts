import prompts from "prompts"
import consola from "consola"
import { randomUUID } from "crypto"

const log = console.log

class Partition {
  private _size: number
  private _id: string
  
  constructor(value: number) {
    this._size = value
    this._id = randomUUID()
  }
  
  public get size() {
    return this._size
  }
  
  public get id() {
    return this._id
  }
}
(async () => {
  const partitions: Partition[] = []
  let biggerPartition: Partition = new Partition(0);

  const { partitionsQuantity }: { partitionsQuantity: number } = await prompts({
    type: "number",
    name: "partitionsQuantity",
    message: "Digite a quantidade de partições",
    min: 1,
    validate: value => value === "" ? "Nenhum número foi digitado. Tente novamente." : true,

  })
  for(let i = 0; i < partitionsQuantity; i++) {
    const { partitionSize }: { partitionSize: number } = await prompts({
      type: "number",
      name: "partitionSize",
      message: `Digite o tamanho da ${i+1}ª partição`,
      min: 1,
      validate: value => value === "" ? "Nenhum número foi digitado. Tente novamente." : true,
    })
    partitions.push(new Partition(partitionSize))
    if(partitions[i].size > biggerPartition.size) {
      biggerPartition = partitions[i]
    }
  }

  console.clear()

  const process: number[] = []
  let processQuantity: number
  while(true) {
    const response: { processQuantity: number } = await prompts({
      type: "number",
      name: "processQuantity",
      message: `Digite a quantidade de processos`,
      min: 1,
      validate: value => value === "" ? "Nenhum número foi digitado. Tente novamente." : true,
    })

    processQuantity = response.processQuantity

    if(processQuantity <= partitionsQuantity) break
    
    consola.warn("A quantidade de processos deve ser menor ou igual a quantidade de partições.")
  }

  let processSize: number
  for(let i = 1; i <= processQuantity; i++) {
    while(true) {
      const response: { processSize: number } = await prompts({
        type: "number",
        name: "processSize",
        message: `Digite o tamanho do ${i}º processo`,
        min: 1,
        validate: value => value === "" ? "Nenhum número foi digitado. Tente novamente." : true,
      })

      processSize = response.processSize

      if(processSize <= biggerPartition.size) break
      
      consola.warn("O tamanho do processo não pode ser maior que o tamanho da maior partição.")
    }
    process.push(processSize)
  }

  console.clear()

  const { algorithm }: { algorithm: string } = await prompts({
    type: "select",
    name: "algorithm",
    message: "Escolha um algoritmo",
    choices: [
      {
        title: "First-Fit",
        value: "ff",
      },
      {
        title: "Best-Fit",
        value: "bf",
      },
      {
        title: "Worst-Fit",
        value: "wf",
      }
    ],
  })

  log(partitions)
  log(process)
  log(algorithm)

  // guardar a partição maior --
  // quantidade de processo não deve exceder quantidade de partições --
  // tamanho do processo não pode exceder o tamanho da maior partição
})()
