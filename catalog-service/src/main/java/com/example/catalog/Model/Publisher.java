package com.example.catalog.Model;

import jakarta.persistence.*;

@Entity
@Table(name = "publishers")
public class Publisher {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 150)
    private String name;


    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String value) { name = value; }

}
