import prompts from "prompts"
import { randomUUID } from "crypto"

class Process {
  private _size: number
  private _id: string
  private _partition: Partition | null

  constructor(initialSize: number, id: string) {
    this._size = initialSize
    this._id = id || randomUUID()
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

  const { processQuantity }: { processQuantity: number } = await prompts({
    type: "number",
    name: "processQuantity",
    message: `Digite a quantidade de processos`,
    min: 1,
    validate: processQuantity => {
      if (processQuantity === "") {
        return "Nenhum número foi digitado. Tente novamente."
      } else if (processQuantity > partitionsQuantity) {
        return "A quantidade de processos deve ser menor ou igual a quantidade de partições."
      } else return true
    },
  })

  const processes: Process[] = []
  for(let i = 1; i <= processQuantity; i++) {
    const { processSize }: { processSize: number } = await prompts({
      type: "number",
      name: "processSize",
      message: `Digite o tamanho do ${i}º processo`,
      min: 1,
      validate: processSize => {
        if (processSize === "") {
          return "Nenhum número foi digitado. Tente novamente."
        } else if(processSize > biggestPartition.size) {
          return "O tamanho do processo não pode ser maior que o tamanho da maior partição."
        } else return true
      },
    })

    const { id }: { id: string } = await prompts({
      type: "text",
      name: "id",
      message: `Digite o ID do ${i}º processo`,
      validate: id => {
        if (id === "") {
          return "ID inválido. Tente novamente."
        } else if (processes.find(process => process.id === id)) {
          return "Esse ID já foi utilizado. Tente novamente."
        } else return true
      },
    })

    processes.push(new Process(processSize, id))

    console.clear()
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
    const copyPartitions = [...partitions]
    const copyProcesses = [...processes]
  
    function findTheClosestPartition(processSize: number): Partition {
      let closestPartition: Partition | undefined
      const closestPartitions: Partition[] = []
  
      for (let i = 0; i < copyPartitions.length; i++) {
        if (copyPartitions[i].size === processSize) {
          closestPartition = copyPartitions[i]
          break
        }
        if (copyPartitions[i].size >= processSize) {
          closestPartitions.push(copyPartitions[i])
        }
      }
  
      if (!closestPartition) {
        closestPartition = closestPartitions[0]
        for (let i = 1; i < closestPartitions.length; i++) {
          if (closestPartitions[i].size < closestPartition.size) {
            closestPartition = closestPartitions[i]
          }
        }
        
      }
  
      return closestPartition
    }
  
    while(true) {
      const closestPartitionIndex = partitions.findIndex(partition => partition === findTheClosestPartition(copyProcesses[0].size))
      const actualProcessIndex = processes.findIndex(process => process === copyProcesses[0])
  
      partitions[closestPartitionIndex].process = processes[actualProcessIndex]
      processes[actualProcessIndex].partition = partitions[closestPartitionIndex]
  
      const auxClosestPartitionIndex = copyPartitions.findIndex(partition => partition === findTheClosestPartition(copyProcesses[0].size))
  
      copyPartitions.splice(auxClosestPartitionIndex, 1)
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
