export type Database = {
  openrace: {
    Tables: {
      races: {
        Row: {
          id: string
          name: string
          date: string
          type: 'enduro' | 'dh' | 'xc'
          location: string | null
          organizer_id: string
          categories: string[]
          rider_id_mode: 'name_only' | 'bib_only' | 'both'
          status: 'draft' | 'active' | 'complete'
          share_code: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          date: string
          type: 'enduro' | 'dh' | 'xc'
          location?: string | null
          organizer_id: string
          categories: string[]
          rider_id_mode: 'name_only' | 'bib_only' | 'both'
          status?: 'draft' | 'active' | 'complete'
          share_code: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          date?: string
          type?: 'enduro' | 'dh' | 'xc'
          location?: string | null
          organizer_id?: string
          categories?: string[]
          rider_id_mode?: 'name_only' | 'bib_only' | 'both'
          status?: 'draft' | 'active' | 'complete'
          share_code?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      stages: {
        Row: {
          id: string
          race_id: string
          name: string
          order: number
          distance: number | null
          elevation: number | null
          start_token: string
          finish_token: string
          created_at: string
        }
        Insert: {
          id?: string
          race_id: string
          name: string
          order: number
          distance?: number | null
          elevation?: number | null
          start_token: string
          finish_token: string
          created_at?: string
        }
        Update: {
          id?: string
          race_id?: string
          name?: string
          order?: number
          distance?: number | null
          elevation?: number | null
          start_token?: string
          finish_token?: string
          created_at?: string
        }
        Relationships: []
      }
      riders: {
        Row: {
          id: string
          race_id: string
          name: string
          bib: string | null
          category: string
          age: number | null
          gender: 'male' | 'female' | 'non_binary'
          created_at: string
        }
        Insert: {
          id?: string
          race_id: string
          name: string
          bib?: string | null
          category: string
          age?: number | null
          gender: 'male' | 'female' | 'non_binary'
          created_at?: string
        }
        Update: {
          id?: string
          race_id?: string
          name?: string
          bib?: string | null
          category?: string
          age?: number | null
          gender?: 'male' | 'female' | 'non_binary'
          created_at?: string
        }
        Relationships: []
      }
      time_records: {
        Row: {
          id: string
          stage_id: string
          rider_id: string | null
          timestamp: number
          type: 'start' | 'finish'
          device_id: string
          created_at: string
        }
        Insert: {
          id: string
          stage_id: string
          rider_id?: string | null
          timestamp: number
          type: 'start' | 'finish'
          device_id: string
          created_at?: string
        }
        Update: {
          id?: string
          stage_id?: string
          rider_id?: string | null
          timestamp?: number
          type?: 'start' | 'finish'
          device_id?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      stage_results: {
        Row: {
          rider_id: string
          stage_id: string
          race_id: string
          start_time: number | null
          finish_time: number | null
          status: string
          elapsed_ms: number | null
        }
        Relationships: []
      }
      race_results: {
        Row: {
          rider_id: string
          race_id: string
          total_time_ms: number | null
          stage_results: object[]
          has_dnf: boolean
          category: string
          overall_rank: number
          category_rank: number
        }
        Relationships: []
      }
    }
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>
    Enums: {
      race_type: 'enduro' | 'dh' | 'xc'
      race_status: 'draft' | 'active' | 'complete'
      rider_id_mode: 'name_only' | 'bib_only' | 'both'
      gender_type: 'male' | 'female' | 'non_binary'
      time_record_type: 'start' | 'finish'
    }
  }
}
