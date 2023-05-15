import prompts from "prompts"
import consola from "consola"
import { randomUUID } from "crypto"

const log = console.log

class Process {
  private _size: number
  private _id: string
  private _partition: Partition | null

  constructor(initialSize: number) {
    this._size = initialSize
    this._id = randomUUID()
    this._partition = null
  }

  public get size(): number {
    return this._size
  }
  
  public get id(): string {
    return this._id
  }

  public get partition(): Partition | null {
    return this._partition
  }
  
  public set partition(partition: Partition | null) {
    this._partition = partition;
  }
}

class Partition {
  private _size: number
  private _id: string
  private _process: Process | null
  
  constructor(initialSize: number) {
    this._size = initialSize
    this._id = randomUUID()
    this._process = null
  }
  
  public get size(): number {
    return this._size
  }
  
  public get id(): string {
    return this._id
  }

  public get process(): Process | null {
    return this._process
  }
  
  public set process(process: Process | null) {
    this._process = process;
  }
}

(async () => {
  let biggestPartition: Partition = new Partition(0);

  const { partitionsQuantity }: { partitionsQuantity: number } = await prompts({
    type: "number",
    name: "partitionsQuantity",
    message: "Digite a quantidade de partições",
    min: 1,
    validate: value => value === "" ? "Nenhum número foi digitado. Tente novamente." : true,

  })

  const partitions: Partition[] = []
  for(let i = 0; i < partitionsQuantity; i++) {
    const { partitionSize }: { partitionSize: number } = await prompts({
      type: "number",
      name: "partitionSize",
      message: `Digite o tamanho da ${i+1}ª partição`,
      min: 1,
      validate: value => value === "" ? "Nenhum número foi digitado. Tente novamente." : true,
    })
    partitions.push(new Partition(partitionSize))
    if(partitions[i].size > biggestPartition.size) {
      biggestPartition = partitions[i]
    }
  }

  console.clear()

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
  const processes: Process[] = []
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

      if(processSize <= biggestPartition.size) break
      
      consola.warn("O tamanho do processo não pode ser maior que o tamanho da maior partição.")
    }
    processes.push(new Process(processSize))
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

  interface ProcessTableData {
    "ID do Processo": string
    "Tamanho do Processo": number
  }

  interface PartitionTableData {
    "Partição": number
    "ID do Processo": string
  }

  function firstFit() {
    for (let par = 0; par < partitions.length; par++) {
      for (let pro = 0; pro < processes.length; pro++) {
        if (partitions[par].process || processes[pro].partition || partitions[par].size < processes[pro].size) continue
        partitions[par].process = processes[pro]
        processes[pro].partition = partitions[par]
      }
    }

    const processTableData: ProcessTableData[] = []
    const partitionTableData: PartitionTableData[] = []

    processes.map(process => {
      processTableData.push({
        "ID do Processo": process.id,
        "Tamanho do Processo": process.size
      })
    })

    partitions.map(partition => {
      partitionTableData.push({
        "Partição": partition.size,
        "ID do Processo": partition.process?.id! ? partition.process?.id : "..."
      })
    })

    console.table(processTableData)
    console.table(partitionTableData)
  }
  
  function bestFit() {
    
  }

  function worstFit() {
    const copyPartitions = [...partitions]
    const copyProcesses = [...processes]
  
    function findTheBiggestPartition(): Partition {
      let biggestPartition: Partition | undefined
  
      for (let i = 0; i < copyPartitions.length; i++) {
        if (biggestPartition === undefined) {
          biggestPartition = copyPartitions[i]
        } else if (copyPartitions[i].size > biggestPartition.size) {
          biggestPartition = copyPartitions[i]
        }
      }
  
      return biggestPartition!
    }
  
    while(true) {
      const biggestPartitionIndex = partitions.findIndex(partition => partition === findTheBiggestPartition())
      const actualProcessIndex = processes.findIndex(process => process === copyProcesses[0])
      partitions[biggestPartitionIndex].process = processes[actualProcessIndex]
      processes[actualProcessIndex].partition = partitions[biggestPartitionIndex]
    
      const auxBiggestPartitionIndex = copyPartitions.findIndex(partition => partition === findTheBiggestPartition())
      copyPartitions.splice(auxBiggestPartitionIndex, 1)
      copyProcesses.shift()
    
      if (copyProcesses.length === 0) break
    }
  
    const processTableData: ProcessTableData[] = []
    const partitionTableData: PartitionTableData[] = []
  
    processes.map(process => {
      processTableData.push({
        "ID do Processo": process.id,
        "Tamanho do Processo": process.size
      })
    })
  
    partitions.map(partition => {
      partitionTableData.push({
        "Partição": partition.size,
        "ID do Processo": partition.process?.id ? partition.process?.id : "..."
      })
    })
  
    console.table(processTableData)
    console.table(partitionTableData)
  }

  switch (algorithm) {
    case "ff":
      firstFit()
      break;

    case "bf":
      bestFit()
      break;

    case "wf":
      worstFit()
      break;
  
    default:
      break;
  }
})()
